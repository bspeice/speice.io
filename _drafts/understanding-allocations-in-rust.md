---
layout: post
title: "Allocations in Rust"
description: "An introduction to the memory model"
category: 
tags: [rust]
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
section for easy citation in the future. To that end, a table of contents is provided
to assist in easy navigation:

- [Foreword](#foreword)
- [Stacking Up: Non-Heap Memory Types](#non-heap-memory-types)
- [Piling On: Rust and the Heap](#piling-on-rust-and-the-heap)
- [Compiler Optimizations Make Everything Complicated](#compiler-optimizations-make-everything-complicated)
- Summary: When Does Rust Allocate?
- [Appendix and Further Reading](#appendix-and-further-reading)

# Foreword

There's a simple checklist to see if you can skip over reading this article. You must:

1. Only write `#![no_std]` crates
2. Never use `unsafe`
3. Never use `#![feature(alloc)]`

For some uses of Rust, typically embedded devices, these constraints make sense.
They're working with very limited memory, and the program binary size itself may
significantly affect what's available! There's no operating system able to manage
this "virtual memory" junk, but that's not an issue because there's only one
running application. The [embedonomicon] is ever in mind, and interacting with the
"real world" through extra peripherals is accomplished by reading and writing to
exact memory addresses.

Most Rust programs find these requirements overly burdensome though. C++ developers
would struggle without access to [`std::vector`](https://en.cppreference.com/w/cpp/container/vector)
(except those hardcore no-STL guys), and Rust developers would struggle without
[`std::vec`](https://doc.rust-lang.org/std/vec/struct.Vec.html). But in this scenario,
`std::vec` is actually part of the [`alloc` crate](https://doc.rust-lang.org/alloc/vec/struct.Vec.html),
and thus off-limits (because the `alloc` crate requires `#![feature(alloc)]`).
Also, `Box` is right out for the same reason.

Whether writing code for embedded devices or not, the important thing in both situations
is how much you know *before your application starts* about what its memory usage will look like.
In embedded devices, there's a small, fixed amount of memory to use.
In a browser, you have no idea how large [google.com](https://www.google.com)'s home page is until you start
trying to download it. The compiler uses this information (or lack thereof) to optimize
how memory is used; put simply, your code runs faster when the compiler can guarantee exactly
how much memory your program needs while it's running. This post is all about understanding
the optimization tricks the compiler uses, and how you can help the compiler and make
your programs more efficient.

Now let's address some conditions and caveats before going much further:

- We'll focus on "safe" Rust only; `unsafe` lets you use platform-specific allocation API's
  (think the [libc] and [winapi] implementations of [malloc]) that we'll ignore.
- We'll assume a "debug" build of Rust code (what you get with `cargo run` and `cargo test`)
  and address (hehe) "release" mode at the end (`cargo run --release` and `cargo test --release`).
- Because of the nature of the content, some (very simple) assembly-level code is involved.
  We'll keep this to a minimum, but I [needed](https://stackoverflow.com/a/4584131/1454178)
  a [refresher](https://stackoverflow.com/a/26026278/1454178) on the `push` and `pop`
  [instructions](http://www.cs.virginia.edu/~evans/cs216/guides/x86.html)
  while writing this post.

And a final warning worth repeating:

> Rust does not currently have a rigorously and formally defined memory model.
>  
> -- [the docs](https://doc.rust-lang.org/std/ptr/fn.read_volatile.html)

# Stacking Up: Non-Heap Memory Types

We'll start with the ["happy path"](https://en.wikipedia.org/wiki/Happy_path):
what happens when Rust is able to figure out *at compile time* how much memory
will be used in your program.

This is important because of the extra optimizations Rust uses when it can predict
how much memory is needed! Let's go over a quick example:

```rust
const MICROS_PER_MILLI: u32 = 1000;
const NANOS_PER_MICRO: u32 = 1000;

pub fn millis_to_nanos(millis: u32) -> u32 {
    let micros = millis * MICROS_PER_MILLI;
    let nanos = micros * NANOS_PER_MICRO;

    return nanos;
}
```
-- [Compiler Explorer](https://godbolt.org/z/tOwngk)

Forgive the overly simple code, but this shows off what the compiler can figure out
about your program:

1. There's one `u32` passed to the function, and two `u32`'s used in the function body.
Each one is 4 bytes, for a total of 12 bytes. We can temporarily reserve space for all
variables because we know exactly how much space is needed.
    - If you're looking at the assembly: `millis` is stored in `edi`,
      `micros` is stored in `eax`, and `nanos` is stored in `ecx`.
      The `eax` register is re-used to store the final result.
2. Because `MICROS_PER_MILLI` and `NANOS_PER_MICRO` are constants, the compiler never
allocates memory, and just burns the constants into the final program.
    - Look for the instructions `mov edi, 1000` and `mov ecx, 1000`.

Given this information, the compiler can efficiently lay out your memory usage so
that the program never needs to ask the kernel/allocator for memory! This example
was a bit silly though, so let's talk about the more interesting details.

## **static** and **const**: Program Allocations

The first memory type we'll look at is pretty special: when Rust can prove that
a *reference* is valid for the lifetime of the program (`static`, not specifically
`'static`), and when a *value* is the same for the lifetime of the program (`const`).
Understanding the distinction between reference and value is important for reasons
we'll go into below. The
[full specification](https://github.com/rust-lang/rfcs/blob/master/text/0246-const-vs-static.md)
for these two memory types is available, but I'd rather take a hands-on approach to the topic.

### **const**

The quick summary is this: `const` declares a read-only block of memory that is loaded
as part of your program binary (during the call to [exec(3)](https://linux.die.net/man/3/exec)).
Any `const` value resulting from calling a `const fn` is guaranteed to be materialized
at compile-time (meaning that access at runtime will not invoke the `const fn`),
even though the function is available at run-time as well. The compiler can choose to
copy the constant value wherever it is deemed practical. Getting the address of a `const`
value is legal, but not guaranteed to be the same even when referring to the same
named identifier.

The first point is a bit strange - "read-only memory". *Typically* in Rust you can use
"inner mutability" to modify things that aren't declared `mut`.
[`RefCell`](https://doc.rust-lang.org/std/cell/struct.RefCell.html) provides an API
to guarantee at runtime that some consistency rules are enforced:

```rust
use std::cell::RefCell;

fn my_mutator(cell: &RefCell<u8>) {
    // Even though we're given an immutable reference,
    // the `replace` method allows us to modify the inner value.
    cell.replace(14);
}

fn main() {
    let cell = RefCell::new(25);
    // Prints out 25
    println!("Cell: {:?}", cell);
    my_mutator(&cell);
    // Prints out 14
    println!("Cell: {:?}", cell);
}
```
-- [Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=8e4bea1a718edaff4507944e825a54b2)

When `const` is involved though, modifications are silently ignored:

```rust
use std::cell::RefCell;

const CELL: RefCell<u8> = RefCell::new(25);

fn my_mutator(cell: &RefCell<u8>) {
    cell.replace(14);
}

fn main() {
    // First line prints 25 as expected
    println!("Cell: {:?}", &CELL);
    my_mutator(&CELL);
    // Second line *still* prints 25
    println!("Cell: {:?}", &CELL);
}
```
-- [Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=88fe98110c33c1b3a51e341f48b8ae00)

And a second example using [`Once`](https://doc.rust-lang.org/std/sync/struct.Once.html):

```rust
use std::sync::Once;

const SURPRISE: Once = Once::new();

fn main() {
    // This is how `Once` is supposed to be used
    SURPRISE.call_once(|| println!("Initializing..."));
    // Because `Once` is a `const` value, we never record it
    // having been initialized the first time, and this closure
    // will also execute.
    SURPRISE.call_once(|| println!("Initializing again???"));
}
```
-- [Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=c3cc5979b5e5434eca0f9ec4a06ee0ed)

[Clippy](https://github.com/rust-lang/rust-clippy) will treat this behavior as an error if attempted,
but it's still something to be aware of.

The next thing to mention is that `const` values are loaded into memory *as part of your program binary*.
Because of this, any `const` values declared in your program will be "realized" at compile-time;
accessing them may trigger a main-memory lookup, but that's it.

```rust
use std::cell::RefCell;

const CELL: RefCell<u32> = RefCell::new(24);

pub fn multiply(value: u32) -> u32 {
    value * (*CELL.get_mut())
}
```
-- [Compiler Explorer](https://godbolt.org/z/ZMjmdM)

The compiler only creates one `RefCell`, and uses it everywhere. However, that value
is fully realized at compile time, and is fully stored in the `.L__unnamed_1` section.

If it's helpful though, the compiler can choose to copy `const` values.

```rust
const FACTOR: u32 = 1000;

pub fn multiply(value: u32) -> u32 {
    value * FACTOR
}

pub fn multiply_twice(value: u32) -> u32 {
    value * FACTOR * FACTOR
}
```
-- [Compiler Explorer](https://godbolt.org/z/Qc7tHM)

In this example, the `FACTOR` value is turned into the `mov edi, 1000` instruction
in both the `multiply` and `multiply_twice` functions; the "1000" value is never
"stored" anywhere, as it's small enough to use directly.

Finally, getting the address of a `const` value is possible but not guaranteed
to be unique (given that the compiler can choose to copy values). In my testing
I was never able to get the compiler to copy a `const` value and get differing pointers,
but the specifications are clear enough: *don't rely on pointers to `const`
values being consistent*. To be frank, I have no idea why you'd ever care about
a pointer to `const`.

### **static**

Final note: `thread_local!()` is always a heap allocation.

## **push** and **pop**: Stack Allocations

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