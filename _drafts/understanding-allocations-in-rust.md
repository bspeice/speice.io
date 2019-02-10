---
layout: post
title: "Allocations in Rust"
description: "An introduction to the memory model."
category: 
tags: [rust, understanding-allocations]
---

There's an alchemy of distilling complex technical topics into articles and videos
that change the way programmers see the tools they interact with on a regular basis.
I knew what a linker was, but there's a staggering amount of complexity in between
[`main()` and your executable](https://www.youtube.com/watch?v=dOfucXtyEsU).
Rust programmers use the [`Box`](https://doc.rust-lang.org/stable/std/boxed/struct.Box.html)
type all the time, but there's a rich history of the Rust language itself wrapped up in
[how special it is](https://manishearth.github.io/blog/2017/01/10/rust-tidbits-box-is-special/).

In a similar vein, I want you to look at code and understand how memory is used;
the complex choreography of operating system, compiler, and program that frees you
to focus on functionality far-flung from frivolous book-keeping. The Rust compiler relieves
a great deal of the cognitive burden associated with memory management, but we're going
to step into its world for a while.

Let's learn a bit about memory in Rust.

# Table of Contents

This post is intended as both guide and reference material; we'll work to establish
an understanding of the different memory types Rust makes use of, then summarize each
section at the end for easy future citation. To that end, a table of contents is in order:

- Foreword
- [The Whole World: Global Memory Usage](/2019/02/the-whole-world)
- [Stacking Up: Fixed Memory](/2019/02/stacking-up)
- [A Heaping Helping: Dynamic Memory](/2019/02/a-heaping-helping)
- [Compiler Optimizations: What It's Done For You Lately](/2019/02/compiler-optimizations)
- [Summary: What Are the Rules?](/2019/02/summary)

# Foreword

Rust's three defining features of [Performance, Reliability, and Productivity](https://www.rust-lang.org/)
are all driven to a great degree by the how the Rust compiler understands
[memory ownership](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html). Unlike managed memory
languages (Java, Python), Rust [doesn't really](https://words.steveklabnik.com/borrow-checking-escape-analysis-and-the-generational-hypothesis)
garbage collect, leading to fast code when [dynamic (heap) memory](https://en.wikipedia.org/wiki/Memory_management#Dynamic_memory_allocation)
isn't necessary. When heap memory is necessary, Rust ensures you can't accidentally mis-manage it.
And because the compiler handles memory "ownership" for you, developers never need to worry about
accidentally deleting data that was needed somewhere else.

That said, there are situations where you won't benefit from work the Rust compiler is doing.
If you:

1. Never use `unsafe`
2. Never use `#![feature(alloc)]` or the [`alloc` crate](https://doc.rust-lang.org/alloc/index.html)

...then it's not possible for you to use dynamic memory! 

For some uses of Rust, typically embedded devices, these constraints make sense.
They have very limited memory, and the program binary size itself may significantly
affect what's available! There's no operating system able to manage
this ["virtual memory"](https://en.wikipedia.org/wiki/Virtual_memory) junk, but that's
not an issue because there's only one running application. The
[embedonomicon](https://docs.rust-embedded.org/embedonomicon/preface.html) is ever in mind,
and interacting with the "real world" through extra peripherals is accomplished by
reading and writing to [specific memory addresses](https://bob.cs.sonoma.edu/IntroCompOrg-RPi/sec-gpio-mem.html).

Most Rust programs find these requirements overly burdensome though. C++ developers
would struggle without access to [`std::vector`](https://en.cppreference.com/w/cpp/container/vector)
(except those hardcore no-STL people), and Rust developers would struggle without
[`std::vec`](https://doc.rust-lang.org/std/vec/struct.Vec.html). But in this scenario,
`std::vec` is actually aliased to a part of the
[`alloc` crate](https://doc.rust-lang.org/alloc/vec/struct.Vec.html), and thus off-limits.
`Box`, `Rc`, etc., are also unusable for the same reason.

Whether writing code for embedded devices or not, the important thing in both situations
is how much you know *before your application starts* about what its memory usage will look like.
In embedded devices, there's a small, fixed amount of memory to use.
In a browser, you have no idea how large [google.com](https://www.google.com)'s home page is until you start
trying to download it. The compiler uses this information (or lack thereof) to optimize
how memory is used; put simply, your code runs faster when the compiler can guarantee exactly
how much memory your program needs while it's running. This post is all about understanding
how the compiler reasons about your program, with an emphasis on how to design your programs
for performance.

Now let's address some conditions and caveats before going much further:

- We'll focus on "safe" Rust only; `unsafe` lets you use platform-specific allocation API's
  ([`malloc`](https://www.tutorialspoint.com/c_standard_library/c_function_malloc.htm)) that we'll ignore.
- We'll assume a "debug" build of Rust code (what you get with `cargo run` and `cargo test`)
  and address (pun intended) release mode at the end (`cargo run --release` and `cargo test --release`).
- All content will be run using Rust 1.32, as that's the highest currently supported in the
  [Compiler Exporer](https://godbolt.org/). As such, we'll avoid upcoming innovations like
  [compile-time evaluation of `static`](https://github.com/rust-lang/rfcs/blob/master/text/0911-const-fn.md)
  that are available in nightly.
- Because of the nature of the content, some (very simple) assembly-level code is involved.
  We'll keep this simple, but I [found](https://stackoverflow.com/a/4584131/1454178)
  a [refresher](https://stackoverflow.com/a/26026278/1454178) on the `push` and `pop`
  [instructions](http://www.cs.virginia.edu/~evans/cs216/guides/x86.html)
  was helpful while writing this post.
- I've tried to be precise in saying only what I can prove using the tools (ASM, docs)
  that are available. That said, if there's something said in error, please reach out
  and let me know - [bradlee@speice.io](mailto:bradlee@speice.io)

Finally, I'll do what I can to flag potential future changes but the Rust docs
have a notice worth repeating:

> Rust does not currently have a rigorously and formally defined memory model.
>  
> -- [the docs](https://doc.rust-lang.org/std/ptr/fn.read_volatile.html)
