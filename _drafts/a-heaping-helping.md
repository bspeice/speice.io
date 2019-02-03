---
layout: post
title: "A Heaping Helping: Dynamic Memory"
description: "The reason Rust exists"
category: 
tags: [rust, understanding-allocations]
---

Managing dynamic memory is hard. Some languages assume users will do it themselves (C, C++),
and some languages go to extreme lengths to protect users from themselves (Java, Python). In Rust,
how the language uses dynamic memory (also referred to as the **heap**) is a system called *ownership*.
And as the docs mention, ownership
[is Rust's most unique feature](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html).

The heap is used in two situations; when the compiler is unable to predict either the *total size
of memory needed*, or *how long the memory is needed for*, it will allocate space in the heap.
This happens pretty frequently; if you want to download the Google home page, you won't know
how large it is until your program runs. And when you're finished with Google, whenever that might be,
we deallocate the memory so it can be used to store other webpages.

We won't go into detail on how the heap is managed; the
[ownership documentation](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html)
does a phenomenal job explaining both the "why" and "how" of memory management. Instead,
we're going to focus on understanding "when" heap allocations occur in Rust.

To start off: take a guess for how many allocations happen in the program below:

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
- Boxed closures (FnBox, others?) are heap allocated
- "Move" semantics don't trigger new allocation; just a change of ownership,
  so are incredibly fast
- Stack-based alternatives to standard library types should be preferred (spin, parking_lot)

## Smart pointers

The first thing to note are the "smart pointer" types.
When you have data that must outlive the scope in which it is declared,
or your data is of unknown or dynamic size, you'll make use of these types.

The term [smart pointer](https://en.wikipedia.org/wiki/Smart_pointer)
comes from C++, and is used to describe objects that are responsible for managing
ownership of data allocated on the heap. The smart pointers available in the `alloc`
crate should look mostly familiar:
- [`Box`](https://doc.rust-lang.org/alloc/boxed/struct.Box.html)
- [`Rc`](https://doc.rust-lang.org/alloc/rc/struct.Rc.html)
- [`Arc`](https://doc.rust-lang.org/alloc/sync/struct.Arc.html)
- [`Cow`](https://doc.rust-lang.org/alloc/borrow/enum.Cow.html)

The [standard library](https://doc.rust-lang.org/std/) also defines some smart pointers,
though more than can be covered in this article. Some examples:
- [`RwLock`](https://doc.rust-lang.org/std/sync/struct.RwLock.html)
- [`Mutex`](https://doc.rust-lang.org/std/sync/struct.Mutex.html)

Finally, there is one [gotcha](https://www.merriam-webster.com/dictionary/gotcha):
cell types (like [`RefCell`](https://doc.rust-lang.org/stable/core/cell/struct.RefCell.html))
look and behave like smart pointers, but don't actually require heap allocation.
Check out the [`core::cell` docs](https://doc.rust-lang.org/stable/core/cell/index.html)
for more information.

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
    // Drop at line 1640
    Box::new(0);
}

pub fn my_rc() {
    // Drop at line 1650
    Rc::new(0);
}

pub fn my_arc() {
    // Drop at line 1660
    Arc::new(0);
}

pub fn my_cow() {
    // Drop at line 1672
    Cow::from("drop");
}
```
-- [Compiler Explorer](https://godbolt.org/z/SaDpWg)

## Collections

Collections types use heap memory because they have dynamic size; they will request more memory
[when needed](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.reserve),
and can [release memory](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.shrink_to_fit)
when it's no longer necessary. This dynamic memory usage forces Rust to heap allocate
everything they contain. In a way, **collections are smart pointers for many objects at once.**
Common types that fall under this umbrella are `Vec`, `HashMap`, and `String`
(not [`&str`](https://doc.rust-lang.org/std/primitive.str.html)).

But while collections store the objects they own in heap memory, *creating new collections
will not allocate on the heap*. This is a bit weird, because if we call `Vec::new()` the
assembly shows a corresponding call to `drop_in_place`:

```rust
pub fn my_vec() {
    // Drop in place at line 481
    Vec::<u8>::new();
}
```
-- [Compiler Explorer](https://godbolt.org/z/1WkNtC)

But because the vector has no elements it is managing, no calls to the allocator
will ever be dispatched. A couple of places to look at for confirming this behavior:
[`Vec::new()`](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.new),
[`HashMap::new()`](https://doc.rust-lang.org/std/collections/hash_map/struct.HashMap.html#method.new),
and [`String::new()`](https://doc.rust-lang.org/std/string/struct.String.html#method.new).