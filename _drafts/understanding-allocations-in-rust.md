---
layout: post
title: "Understanding Heap Allocations in Rust"
description: "An introduction to the Rust memory model"
category: 
tags: [rust]
---

There's an alchemy of distilling complex technical topics into articles and videos
that change the way programmers see the tools they interact with on a regular basis.
I knew what a linker was, but there's a staggering complexity to get from
[from `main()` to an executable](https://www.youtube.com/watch?v=dOfucXtyEsU).
Rust programmers use the [`Box`](https://doc.rust-lang.org/stable/std/boxed/struct.Box.html)
type all the time, but there's a rich history of the Rust language itself wrapped up in
[how special it is](https://manishearth.github.io/blog/2017/01/10/rust-tidbits-box-is-special/).

In a similar vein, I want you to look at code and understand memory;
the complex choreography of processor, operating system, and program that frees you
to focus on functionality far-flung from frivolous book-keeping. The Rust compiler relieves
a great deal of the cognitive burden associated with memory management, but let's make time
to explore what's going on under the hood.

Let's learn a bit about memory in Rust.

# Table of Contents

This post is intended as both guide and reference material; we'll work to establish
an understanding of the different memory types Rust makes use of, then summarize each
section for easy citation in the future. To that end, a table of contents is provided
to assist in easy navigation:

- [Foreword](#foreword)
- [Non-Heap Memory Types](#non-heap-memory-types)
- [Piling On - Rust and the Heap](#piling-on-rust-and-the-heap)
- [Compiler Optimizations Make Everything Complicated](#compiler-optimizations-make-everything-complicated)
- Summary: When Does Rust Allocate?
- [Appendix and Further Reading](#appendix-and-further-reading)

# Foreword

There's a simple way to guarantee you never need to know the content
of this article:

1. Only write `#![no_std]` crates
2. Never use `unsafe`
3. Never use `#![feature(alloc)]`

For some uses of Rust, typically embedded devices, these constraints make sense.
They're working with very limited memory, and the program binary size itself may
affect the memory available! There's no operating system able to manage the heap,
but that's not an issue because your program is likely the only one running.
The [embedonomicon] is ever in mind, and you just might interact with extra
peripherals by reading and writing to exact memory addresses.

Most Rust programs find these requirements overly burdensome though. C++ developers
would struggle without access to [`std::vector`](https://en.cppreference.com/w/cpp/container/vector),
and Rust developers would struggle without [`std::vec`](https://doc.rust-lang.org/std/vec/struct.Vec.html).
But in this scenario, `std::vec` is actually part of the
[`alloc` crate](https://doc.rust-lang.org/alloc/vec/struct.Vec.html), and thus off-limits.
Or how would you use trait objects? Rust's monomorphization still works, but there's no
[`Box<dyn Trait>`](https://doc.rust-lang.org/alloc/boxed/struct.Box.html)
available to use for dynamic dispatch.

Given a target audience of "basically every Rust developer," let's talk about
some of the details you don't normally have to worry about. This article will focus
on "safe" Rust only; `unsafe` mode allows you to make use of platform-specific
allocation APIs (think [libc] and [winapi] implementations of [malloc]) that
we'll ignore for the time being. We'll also assume a "debug" build of libraries
and applications (what you get with `cargo run` and `cargo test`) and address
"release" mode at the end (`cargo run --release` and `cargo test --release`).

Finally, a caveat: while the details are unlikely to change, the Rust docs
include a warning worth repeating here:

> Rust does not currently have a rigorously and formally defined memory model.
> - the [Rust docs](https://doc.rust-lang.org/std/ptr/fn.read_volatile.html)

# Non-Heap Memory Types

Example: Why doesn't `Vec::new()` go to the allocator?

Questions:

1. What is the "Push" instruction? Why do we like the stack?
2. How does Rust allocate arguments to the function?
3. How does Rust allocate variables created in the function but never returned?
4. How does Rust allocate variables created in the function and returned?
5. How do Option<> or Result<> affect structs?
6. How are arrays allocated?
7. Legal to pass an array as an argument?

# Piling On - Rust and the Heap

Example: How to trigger a heap allocation

Questions:

1. Where do collection types allocate memory?
2. Does a Box<> always allocate heap?
    - Yes, with exception of compiler optimizations
3. Passing Box<Trait> vs. genericizing/monomorphization
    - If it uses `dyn Trait`, it's on the heap.
4. Other pointer types? Do Rc<>/Arc<> force heap allocation?
    - Maybe? Part of the alloc crate, but should use qadapt to check

# Compiler Optimizations Make Everything Complicated

Example: Compiler stripping out allocations of Box<>, Vec::push()

# Appendix and Further Reading

[Embedonomicon]: 

[embedonomicon]: https://docs.rust-embedded.org/embedonomicon/
[libc]: CRATES.IO LINK
[winapi]: CRATES.IO LINK
[malloc]: MANPAGE LINK