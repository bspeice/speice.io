---
layout: post
title: "Compiler Optimizations: What It's Done Lately"
description: "A lot. The answer is a lot."
category: 
tags: [rust, understanding-allocations]
---

Up to this point, we've been discussing memory usage in the Rust language
by focusing on simple rules that are mostly right for small chunks of code.
We've spent time showing how those rules work themselves out in practice,
and become familiar with reading the assembly code needed to see each memory
type (global, stack, heap) in action.

But throughout the content so far, we've put a handicap on the code.
In the name of consistent and understandable results, we've asked the
compiler to pretty please leave the training wheels on. Now is the time
where we throw out all the rules and take the kid gloves off. As it turns out,
both the Rust compiler and the LLVM optimizers are incredibly sophisticated,
and we'll step back and let them do their job.

Similar to ["What Has My Compiler Done For Me Lately?"](https://www.youtube.com/watch?v=bSkpMdDe4g4),
we're focusing on interesting things the Rust language (and LLVM!) can do
as regards memory management. We'll still be looking at assembly code to
understand what's going on, but it's important to mention again:
**please use automated tools like
[alloc-counter](https://crates.io/crates/alloc_counter) to double-check 
memory behavior if it's something you care about**. 
It's far too easy to mis-read assembly in large code sections, you should
always have an automated tool verify behavior if you care about memory usage.

The guiding principal as we move forward is this: *optimizing compilers
won't produce worse assembly than we started with.* There won't be any
situations where stack allocations get moved to heap allocations.
There will, however, be an opera of optimization.

# The Case of the Disappearing Box

Our first optimization comes when LLVM can reason that the lifetime of an object
is sufficiently short that heap allocations aren't necessary. In these cases,
LLVM will move the allocation to the stack instead! The way this interacts
with `#[inline]` attributes is a bit opaque, but the important part is that LLVM
can sometimes do better than the baseline Rust language.

```rust
use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicBool, Ordering};

pub fn main() {
    // Turn on panicking if we allocate on the heap
    DO_PANIC.store(true, Ordering::SeqCst);
    
    // This code will only run with the mode set to "Release".
    // If you try running in "Debug", you'll get a panic.
    let x = Box::new(0);
    drop(x);
    
    // Turn off panicking, as there are some deallocations
    // when we exit main.
    DO_PANIC.store(false, Ordering::SeqCst);
}

#[global_allocator]
static A: PanicAllocator = PanicAllocator;
static DO_PANIC: AtomicBool = AtomicBool::new(false);
struct PanicAllocator;

unsafe impl GlobalAlloc for PanicAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        if DO_PANIC.load(Ordering::SeqCst) {
            panic!("Unexpected allocation.");
        }
        System.alloc(layout)
    }
    
    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        if DO_PANIC.load(Ordering::SeqCst) {
            panic!("Unexpected deallocation.");
        }
        System.dealloc(ptr, layout);
    }
}
```
-- [Rust Playground](https://play.rust-lang.org/?version=stable&mode=release&edition=2018&gist=614994a20e362bf04de868b19daf5ca4)

# Vectors of Usual Size

With some collections, LLVM can predict how large they will become
and allocate the entire size on the stack instead of the heap.
This works whether with both the pre-allocation (`Vec::with_capacity`)
*and re-allocation* (`Vec::push`) methods for collections types.
Not only can LLVM predict sizing if you reserve the fully size up front,
it can see through the resizing operations and find the total size.
While this specific optimization is unlikely to come up in production
usage, it's cool to note that LLVM does a considerable amount of work
to understand what code actually does.

```rust
use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicBool, Ordering};

fn main() {
    // Turn on panicking if we allocate on the heap
    DO_PANIC.store(true, Ordering::SeqCst);
    
    // If the compiler can predict how large a vector will be,
    // it can optimize out the heap storage needed. This also
    // works with `Vec::with_capacity()`, but the push case
    // is a bit more interesting.
    let mut x: Vec<u64> = Vec::new();
    x.push(12);
    assert_eq!(x[0], 12);
    drop(x);
    
    // Turn off panicking, as there are some deallocations
    // when we exit main.
    DO_PANIC.store(false, Ordering::SeqCst);
}

#[global_allocator]
static A: PanicAllocator = PanicAllocator;
static DO_PANIC: AtomicBool = AtomicBool::new(false);
struct PanicAllocator;

unsafe impl GlobalAlloc for PanicAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        if DO_PANIC.load(Ordering::SeqCst) {
            panic!("Unexpected allocation.");
        }
        System.alloc(layout)
    }
    
    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        if DO_PANIC.load(Ordering::SeqCst) {
            panic!("Unexpected deallocation.");
        }
        System.dealloc(ptr, layout);
    }
}
```
-- [Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=1dfccfcf63d8800e644a3b948f1eeb7b)

# Dr. Array or: How I Learned to Love the Optimizer

Finally, this isn't so much about LLVM figuring out different memory behavior,
but LLVM totally stripping out code that has no side effects. Optimizations of
this type have a lot of nuance to them; if you're not careful, they can
make your benchmarks look
[impossibly good](https://www.youtube.com/watch?v=nXaxk27zwlk&feature=youtu.be&t=1199).
In Rust, the `black_box` function (in both
[`libtest`](https://doc.rust-lang.org/1.1.0/test/fn.black_box.html) and
[`criterion`](https://docs.rs/criterion/0.2.10/criterion/fn.black_box.html))
will tell the compiler to disable this kind of optimization. But if you let
LLVM remove unnecessary code, you can end up with programs that
would have previously caused errors running just fine:

```rust
#[derive(Default)]
struct TwoFiftySix {
    _a: [u64; 32]
}

#[derive(Default)]
struct EightK {
    _a: [TwoFiftySix; 32]
}

#[derive(Default)]
struct TwoFiftySixK {
    _a: [EightK; 32]
}

#[derive(Default)]
struct EightM {
    _a: [TwoFiftySixK; 32]
}

pub fn main() {
    // Normally this blows up because we can't reserve size on stack
    // for the `EightM` struct. But because the compiler notices we
    // never do anything with `_x`, it optimizes out the stack storage
    // and the program completes successfully.
    let _x = EightM::default();
}
```
-- [Compiler Explorer](https://godbolt.org/z/daHn7P)
-- [Rust Playground](https://play.rust-lang.org/?version=stable&mode=release&edition=2018&gist=4c253bf26072119896ab93c6ef064dc0)
