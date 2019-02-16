---
layout: post
title: "Insane Allocators: SEGFAULTs in safe Rust"
description: "\"Trusting trust\" with allocators."
category: rust, memory
tags: []
---

Having recently spent a lot of time studying the weird ways that
[Rust uses memory](/2019/02/understanding-allocations-in-rust.html),
I like to think I finally understand the rules well enough to
break them. Specifically - what are the assumptions that underpin
Rust's memory model? It wasn't a question particularly relevant
to understanding how Rust allocates memory, but is certainly worth
discussing as an addendum. Let's finish off this series on Rust and
memory by breaking the most important rules Rust has!

Rust's whole shtick is that it's "memory safe." In practice,
this (should) mean that there's no undefined behavior in safe Rust,
because the compiler/borrow checker makes sure you can't get yourself
into a situation where you misuse or corrupt memory. But is it possible
for Rust programs, *written without using `unsafe`*, to encounter a
[segfault](https://en.wikipedia.org/wiki/Segmentation_fault)?

Of course it is! Using an unmodified compiler, I can build a simple
"Hello, world!" application that dies due to memory corruption:

<script id="asciicast-ENIpRYpdDazCkppanf3LSCetX" src="https://asciinema.org/a/ENIpRYpdDazCkppanf3LSCetX.js" async></script>

# Wait, wat?

There's obviously something nefarious going on. I mean, why would
anyone use `sudo` to run the `rustc` compiler?

And for that matter, why does Rust 1.31.0 behave differently
from Rust 1.32.0?

To pull off this chicanery, I'm making use of a special environment
variable in Linux called [`LD_PRELOAD`](https://blog.fpmurphy.com/2012/09/all-about-ld_preload.html).
I won't go into detail the way [Matt Godbolt does](https://www.youtube.com/watch?v=dOfucXtyEsU),
but the important bit is this: I can insert my own code in place of
functions typically implemented by the [C standard library](https://www.gnu.org/software/libc/).

Second, there's a very special implementation of [`malloc`](https://linux.die.net/man/3/malloc)
that is being picked up by `LD_PRELOAD`:

```rust
use std::ffi::c_void;
use std::ptr::null_mut;

// Start off with an empty pointer
static mut ALLOC: *mut c_void = null_mut();

#[no_mangle]
pub extern "C" fn malloc(size: usize) -> *mut c_void {
    unsafe { 
        // If we've never allocated anything, ask the operating system
        // for some memory...
        if ALLOC == null_mut() {
            ALLOC = libc::malloc(size)
        }
        // ...and then give that same section of memory to everyone,
        // corrupting the location.
        return ALLOC;
    }
}
```

Now, there are two questions yet to answer:
1. Why was `sudo` used to compile?
2. Why did Rust 1.31 work when 1.32 didn't?
