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