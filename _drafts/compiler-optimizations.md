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
we're focusing on interesting things the Rust language (and LLVM!) can do.
We'll still be looking at assembly code to understand what's going on,
but it's important to mention again: **please use automated tools like
[alloc-counter](https://crates.io/crates/alloc_counter) to double-check memory behavior**. 
It's far too easy to mis-read assembly in large code sections, you should
always have an automated tool verify behavior if you care about memory usage.

The guiding principal as we move forward is this: *optimizing compilers
won't produce worse assembly than we started with.* There won't be any
situations where stack allocations get moved to heap allocations.
There will, however, be an opera of optimization.

# The Case of the Disappearing Box

```rust
use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicBool, Ordering};

fn allocate_box() {
    let _x = Box::new(0);
}

pub fn main() {
    // Turn on panicking if we allocate on the heap
    DO_PANIC.store(true, Ordering::SeqCst);
    
    // This code will only run with the mode set to "Release".
    // If you try running in "Debug", you'll get a panic.
    allocate_box();
    
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
-- [Rust Playground](https://play.rust-lang.org/?version=stable&mode=release&edition=2018&gist=3fe2846dac6755dbb7bb90342d0bf135)

# Vectors of Usual Size

```rust
use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicBool, Ordering};

fn main() {
    // Turn on panicking if we allocate on the heap
    DO_PANIC.store(true, Ordering::SeqCst);
    
    // If the compiler can predict how large a vector will be,
    // it can optimize out the heap storage needed.
    let x: Vec<u64> = Vec::with_capacity(5);
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
-- [Rust Playground](https://play.rust-lang.org/?version=stable&mode=release&edition=2018&gist=5e9761b63243018d094829d901dd85c4)

# Dr. Array or: How I Learned to Love the Optimizer

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
