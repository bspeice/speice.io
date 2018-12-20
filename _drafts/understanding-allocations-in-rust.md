---
layout: post
title: "Understanding Allocations"
description: "An introduction to the Rust memory model"
category: 
tags: [rust]
---

There's an alchemy of distilling complex technical topics into articles and videos
that change the way programmers see the tools they interact with on a regular basis.
I've known what a linker was, but there's a staggering complexity to get from
[source code to `main()`](https://www.youtube.com/watch?v=dOfucXtyEsU). Rust programmers
use the [`Box`](https://doc.rust-lang.org/stable/std/boxed/struct.Box.html) type
all the time, but there's a rich history of the Rust language itself wrapped up in
[how special it is](https://manishearth.github.io/blog/2017/01/10/rust-tidbits-box-is-special/).

In a similar vein, I want you to look at code and understand memory;
the complex choreography of processor, operating system, and program that frees you
to focus on functionality beyond rote book-keeping. The Rust compiler relieves a great deal
of the cognitive burden associated with memory management. Even so, let's make time
to explore what's going on under the hood, so we can make better exploit the systems
involved in the code we write.

Let's learn a bit about allocating memory in Rust.

# Table of Contents

This post is intended as both guide and reference material; we'll work to establish
an understanding of how Rust makes use of memory in a program, then summarize each
section for easy citation in the future. To that end, a table of contents is provided
to assist in easy navigation:

- [Distinguishing regions of memory](#distinguishing-regions-of-memory)
- Rust and the Stack
- Rust and the Heap
- Understanding Compiler Optimizations
- Summary: When does Rust allocate?

# Distinguishing regions of memory

# Rust and the Stack

Example: Why doesn't `Vec::new()` go to the allocator?

Questions:

1. What is the "Push" instruction? Why do we like the stack?
2. How does Rust allocate arguments to the function?
3. How does Rust allocate variables created in the function but never returned?
4. How does Rust allocate variables created in the function and returned?
5. How do Option<> or Result<> affect structs?
6. How are arrays allocated?
7. Legal to pass an array as an argument?

# Rust and the Heap

Example: How to trigger a heap allocation

Questions:

1. Where do collection types allocate memory?
2. Does a Box<> always allocate heap?
3. Passing Box<Trait> vs. genericizing/monomorphization

# Understanding compiler optimizations

Example: Compiler stripping out allocations of Box<>, Vec::push()