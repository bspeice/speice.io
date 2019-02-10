---
layout: post
title: "Dynamic Memory: A Heaping Helping"
description: "The reason Rust exists."
category: 
tags: [rust, understanding-allocations]
---

Managing dynamic memory is hard. Some languages assume users will do it themselves (C, C++),
and some languages go to extreme lengths to protect users from themselves (Java, Python). In Rust,
how the language uses dynamic memory (also referred to as the **heap**) is a system called *ownership*.
And as the docs mention, ownership
[is Rust's most unique feature](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html).

The heap is used in two situations: when the compiler is unable to predict the *total size
of memory needed*, or *how long the memory is needed for*, it will allocate space in the heap.
This happens pretty frequently; if you want to download the Google home page, you won't know
how large it is until your program runs. And when you're finished with Google, whenever that
happens to be, we deallocate the memory so it can be used to store other webpages. If you're 
interested in a slightly longer explanation of the heap, check out
[The Stack and the Heap](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html#the-stack-and-the-heap)
in Rust's documentation.

We won't go into detail on how the heap is managed; the
[ownership documentation](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html)
does a phenomenal job explaining both the "why" and "how" of memory management. Instead,
we're going to focus on understanding "when" heap allocations occur in Rust.

To start off, take a guess for how many allocations happen in the program below:

```rust
fn main() {}
```

It's obviously a trick question; while no heap allocations happen as a result of
the code listed above, the setup needed to call `main` does allocate on the heap.
Here's a way to show it:

```rust
#![feature(integer_atomics)]
use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicU64, Ordering};

static ALLOCATION_COUNT: AtomicU64 = AtomicU64::new(0);

struct CountingAllocator;

unsafe impl GlobalAlloc for CountingAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        ALLOCATION_COUNT.fetch_add(1, Ordering::SeqCst);
        System.alloc(layout)
    }
    
    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        System.dealloc(ptr, layout);
    }
}

#[global_allocator]
static A: CountingAllocator = CountingAllocator;

fn main() {
    let x = ALLOCATION_COUNT.fetch_add(0, Ordering::SeqCst);
    println!("There were {} allocations before calling main!", x);
}
```
-- [Rust Playground](https://play.rust-lang.org/?version=nightly&mode=debug&edition=2018&gist=fb5060025ba79fc0f906b65a4ef8eb8e)

As of the time of writing, there are five allocations that happen before `main`
is ever called.

But when we want to understand more practically where heap allocation happens,
we'll follow this guide:

- Smart pointers hold their contents in the heap
- Collections are smart pointers for many objects at a time, and reallocate
  when they need to grow

Finally, there are two "addendum" issues that are important to address when discussing
Rust and the heap:
- Stack-based alternatives to some standard library types are available
- Special allocators to track memory behavior are available

# Smart pointers

The first thing to note are the "smart pointer" types.
When you have data that must outlive the scope in which it is declared,
or your data is of unknown or dynamic size, you'll make use of these types.

The term [smart pointer](https://en.wikipedia.org/wiki/Smart_pointer)
comes from C++, and while it's closely linked to a general design pattern of
["Resource Acquisition Is Initialization"](https://en.cppreference.com/w/cpp/language/raii),
we'll use it here specifically to describe objects that are responsible for managing
ownership of data allocated on the heap. The smart pointers available in the `alloc`
crate should look mostly familiar:
- [`Box`](https://doc.rust-lang.org/alloc/boxed/struct.Box.html)
- [`Rc`](https://doc.rust-lang.org/alloc/rc/struct.Rc.html)
- [`Arc`](https://doc.rust-lang.org/alloc/sync/struct.Arc.html)
- [`Cow`](https://doc.rust-lang.org/alloc/borrow/enum.Cow.html)

The [standard library](https://doc.rust-lang.org/std/) also defines some smart pointers
to manage heap objects, though more than can be covered here. Some examples:
- [`RwLock`](https://doc.rust-lang.org/std/sync/struct.RwLock.html)
- [`Mutex`](https://doc.rust-lang.org/std/sync/struct.Mutex.html)

Finally, there is one ["gotcha"](https://www.merriam-webster.com/dictionary/gotcha):
**cell types** (like [`RefCell`](https://doc.rust-lang.org/stable/core/cell/struct.RefCell.html))
look and behave similarly, but **don't involve heap allocation**. The
[`core::cell` docs](https://doc.rust-lang.org/stable/core/cell/index.html)
have more information.

When a smart pointer is created, the data it is given is placed in heap memory and
the location of that data is recorded in the smart pointer. Once the smart pointer
has determined it's safe to deallocate that memory (when a `Box` has
[gone out of scope](https://doc.rust-lang.org/stable/std/boxed/index.html) or when
reference count for an object [goes to zero](https://doc.rust-lang.org/alloc/rc/index.html)),
the heap space is reclaimed. We can prove these types use heap memory by
looking at code:

```rust
use std::rc::Rc;
use std::sync::Arc;
use std::borrow::Cow;

pub fn my_box() {
    // Drop at assembly line 1640
    Box::new(0);
}

pub fn my_rc() {
    // Drop at assembly line 1650
    Rc::new(0);
}

pub fn my_arc() {
    // Drop at assembly line 1660
    Arc::new(0);
}

pub fn my_cow() {
    // Drop at assembly line 1672
    Cow::from("drop");
}
```
-- [Compiler Explorer](https://godbolt.org/z/4AMQug)

# Collections

Collections types use heap memory because their contents have dynamic size; they will request
more memory [when needed](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.reserve),
and can [release memory](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.shrink_to_fit)
when it's no longer necessary. This dynamic property forces Rust to heap allocate
everything they contain. In a way, **collections are smart pointers for many objects at once.**
Common types that fall under this umbrella are
[`Vec`](https://doc.rust-lang.org/stable/alloc/vec/struct.Vec.html),
[`HashMap`](https://doc.rust-lang.org/stable/std/collections/struct.HashMap.html), and
[`String`](https://doc.rust-lang.org/stable/alloc/string/struct.String.html)
(not [`&str`](https://doc.rust-lang.org/std/primitive.str.html)).

But while collections store the objects they own in heap memory, *creating new collections
will not allocate on the heap*. This is a bit weird; if we call `Vec::new()`, the
assembly shows a corresponding call to `real_drop_in_place`:

```rust
pub fn my_vec() {
    // Drop in place at line 481
    Vec::<u8>::new();
}
```
-- [Compiler Explorer](https://godbolt.org/z/1WkNtC)

But because the vector has no elements it is managing, no calls to the allocator
will ever be dispatched:

```rust
use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicBool, Ordering};

fn main() {
    // Turn on panicking if we allocate on the heap
    DO_PANIC.store(true, Ordering::SeqCst);
    
    // Interesting bit happens here
    let x: Vec<u8> = Vec::new();
    drop(x);
    
    // Turn panicking back off, some deallocations occur
    // after main as well.
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
-- [Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=831a297d176d015b1f9ace01ae416cc6)

Other standard library types follow the same behavior; make sure to check out
[`HashMap::new()`](https://doc.rust-lang.org/std/collections/hash_map/struct.HashMap.html#method.new),
and [`String::new()`](https://doc.rust-lang.org/std/string/struct.String.html#method.new).

# Heap Alternatives

While it is a bit strange for us to talk of the stack after spending time with the heap,
it's worth pointing out that some heap-allocated objects in Rust have stack-based counterparts
provided by other crates. If you have need of the functionality, but want to avoid allocating,
there are some great alternatives.

When it comes to some of the standard library smart pointers
([`RwLock`](https://doc.rust-lang.org/std/sync/struct.RwLock.html) and
[`Mutex`](https://doc.rust-lang.org/std/sync/struct.Mutex.html)), stack-based alternatives
are provided in crates like [parking_lot](https://crates.io/crates/parking_lot) and
[spin](https://crates.io/crates/spin). You can check out
[`lock_api::RwLock`](https://docs.rs/lock_api/0.1.5/lock_api/struct.RwLock.html),
[`lock_api::Mutex`](https://docs.rs/lock_api/0.1.5/lock_api/struct.Mutex.html), and
[`spin::Once`](https://mvdnes.github.io/rust-docs/spin-rs/spin/struct.Once.html)
if you're in need of synchronization primitives.

[thread_id](https://crates.io/crates/thread-id)
may still be necessary if you're implementing an allocator (*cough cough* the author *cough cough*)
because [`thread::current().id()`](https://doc.rust-lang.org/std/thread/struct.ThreadId.html)
[uses a `thread_local!` structure](https://doc.rust-lang.org/stable/src/std/sys_common/thread_info.rs.html#22-40)
that needs heap allocation.

# Tracing Allocators

When writing performance-sensitive code, there's no alternative to measuring your code.
If you didn't write a benchmark,
[you don't care about it's performance](https://www.youtube.com/watch?v=2EWejmkKlxs&feature=youtu.be&t=263)
You should never rely on your instincts when
[a microsecond is an eternity](https://www.youtube.com/watch?v=NH1Tta7purM).

Similarly, there's great work going on in Rust with allocators that keep track of what
they're doing. [`alloc_counter`](https://crates.io/crates/alloc_counter) was designed
for exactly this purpose. When it comes to tracking heap behavior, you shouldn't just
rely on the language; please measure and make sure that you have tools in place to catch
any issues that come up.
