---
layout: post
title: "Stacking Up: Fixed Memory"
description: "Going fast in Rust"
category: 
tags: [rust, understanding-allocations]
---

`const` and `static` are perfectly fine, but it's very rare that we know
at compile-time about either values or references that will be the same for the entire
time our program is running. Put another way, it's not often the case that either you
or your compiler know how much memory your entire program will need.

However, there are still some optimizations the compiler can do if it knows how much
memory individual functions will need. Specifically, the compiler can make use of
"stack" memory (as opposed to "heap" memory) which can be managed far faster in
both the short- and long-term. When requesting memory, the
[`push` instruction](http://www.cs.virginia.edu/~evans/cs216/guides/x86.html)
can typically complete in [1 or 2 cycles](https://agner.org/optimize/instruction_tables.ods)
(<1 nanosecond on modern CPUs). Heap memory instead requires using an allocator
(specialized software to track what memory is in use) to reserve space.
And when you're finished with your memory, the `pop` instruction likewise runs in
1-3 cycles, as opposed to an allocator needing to worry about memory fragmentation
and other issues. All sorts of incredibly sophisticated techniques have been used
to design allocators:
- [Garbage Collection](https://en.wikipedia.org/wiki/Garbage_collection_(computer_science))
  strategies like [Tracing](https://en.wikipedia.org/wiki/Tracing_garbage_collection)
  (used in [Java](https://www.oracle.com/technetwork/java/javase/tech/g1-intro-jsp-135488.html))
  and [Reference counting](https://en.wikipedia.org/wiki/Reference_counting)
  (used in [Python](https://docs.python.org/3/extending/extending.html#reference-counts))
- Thread-local structures to prevent locking the allocator in [tcmalloc](https://jamesgolick.com/2013/5/19/how-tcmalloc-works.html)
- Arena structures used in [jemalloc](http://jemalloc.net/), which until recently
  was the primary allocator for Rust programs!

But no matter how fast your allocator is, the principle remains: the
fastest allocator is the one you never use. As such, we're not going to go
in detail on how exactly the
[`push` and `pop` instructions work](http://www.cs.virginia.edu/~evans/cs216/guides/x86.html),
and we'll focus instead on the conditions that enable the Rust compiler to use
the faster stack-based allocation for variables.

With that in mind, let's get into the details. How do we know when Rust will or will not use
stack allocation for objects we create? Looking at other languages, it's often easy to delineate
between stack and heap. Managed memory languages (Python, Java,
[C#](https://blogs.msdn.microsoft.com/ericlippert/2010/09/30/the-truth-about-value-types/)) assume
everything is on the heap. JIT compilers ([PyPy](https://www.pypy.org/),
[HotSpot](https://www.oracle.com/technetwork/java/javase/tech/index-jsp-136373.html)) may
optimize some heap allocations away, but you should never assume it will happen.
C makes things clear with calls to special functions ([malloc(3)](https://linux.die.net/man/3/malloc)
is one) being the way to use heap memory. Old C++ has the [`new`](https://stackoverflow.com/a/655086/1454178)
keyword, though modern C++/C++11 is more complicated with [RAII](https://en.cppreference.com/w/cpp/language/raii).

For Rust specifically, the principle is this: *stack allocation will be used for everything
that doesn't involve "smart pointers" and collections.* If we're interested in dissecting it though,
there are three things we pay attention to:

1. Stack manipulation instructions (`push`, `pop`, and `add`/`sub` of the `rsp` register)
   indicate allocation of stack memory:
   ```rust
   pub fn stack_alloc(x: u32) -> u32 {
       // Space for `y` is allocated by subtracting from `rsp`,
       // and then populated
       let y = [1u8, 2, 3, 4];
       // Space for `y` is deallocated by adding back to `rsp`
       x
   }
   ```
   -- [Compiler Explorer](https://godbolt.org/z/5WSgc9)

2. Tracking when exactly heap allocation calls happen is difficult. It's typically easier to
   watch for `call core::ptr::real_drop_in_place`, and infer that a heap allocation happened
   in the recent past:
   ```rust
   pub fn heap_alloc(x: usize) -> usize {
       // Space for elements in a vector has to be allocated
       // on the heap, and is then de-allocated once the
       // vector goes out of scope
       let y: Vec<u8> = Vec::with_capacity(x);
       x
   }
   ```
   -- [Compiler Explorer](https://godbolt.org/z/epfgoQ) (`real_drop_in_place` happens on line 1317)
   <span style="font-size: .8em">Note: While the [`Drop` trait](https://doc.rust-lang.org/std/ops/trait.Drop.html)
   is [called for stack-allocated objects](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=87edf374d8983816eb3d8cfeac657b46),
   the Rust standard library only defines `Drop` implementations for types that involve heap allocation.</span> 

3. If you don't want to inspect the assembly, use a custom allocator that's able to track
   and alert when heap allocations occur. As an unashamed plug, [qadapt](https://crates.io/crates/qadapt)
   was designed for exactly this purpose.

With all that in mind, let's talk about situations in which we're guaranteed to use stack memory:

- Structs are created on the stack.
- Function arguments are passed on the stack.
- Enums and unions are stack-allocated.
- [Arrays](https://doc.rust-lang.org/std/primitive.array.html) are always stack-allocated.
- Using the [`#[inline]` attribute](https://doc.rust-lang.org/reference/attributes.html#inline-attribute)
  will not change the memory region used.
- Closures capture their arguments on the stack
- Generics will use stack allocation, even with dynamic dispatch.

## Structs



## Enums

It's been a worry of mine that I'd manage to trigger a heap allocation because
of wrapping an underlying type in 
Given that you're not using smart pointers, `enum` and other wrapper types will never use
heap allocations. This shows up most often with
[`Option`](https://doc.rust-lang.org/stable/core/option/enum.Option.html) and
[`Result`](https://doc.rust-lang.org/stable/core/result/enum.Result.html) types,
but generalizes to any other types as well.

Because the size of an `enum` is the size of its largest element plus the size of a
discriminator, the compiler can predict how much memory is used. If enums were
sized as tightly as possible, heap allocations would be needed to handle the fact
that enum variants were of dynamic size!

## Arrays

The array type is guaranteed to be stack allocated, which is why the array size must
be declared. Interestingly enough, this can be used to cause safe Rust programs to crash:

```rust
// 256 bytes
#[derive(Default)]
struct TwoFiftySix {
    _a: [u64; 32]
}

// 8 kilobytes
#[derive(Default)]
struct EightK {
    _a: [TwoFiftySix; 32]
}

// 256 kilobytes
#[derive(Default)]
struct TwoFiftySixK {
    _a: [EightK; 32]
}

// 8 megabytes - exceeds space typically provided for the stack,
// though the kernel can be instructed to allocate more.
// On Linux, you can check stack size using `ulimit -s`
#[derive(Default)]
struct EightM {
    _a: [TwoFiftySixK; 32]
}

fn main() {
    // Because we already have things in stack memory
    // (like the current function), allocating another
    // eight megabytes of stack memory crashes the program
    let _x = EightM::default();
}
```
-- [Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=137893e3ae05c2f32fe07d6f6f754709)

There aren't any security implications of this (no memory corruption occurs,
just running out of memory), but it's good to note that the Rust compiler
won't move arrays into heap memory even if they can be reasonably expected
to overflow the stack.

## **inline** attributes

## Closures

Rules for how anonymous functions capture their arguments are typically language-specific.
In Java, [Lambda Expressions](https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html)
are actually objects created on the heap that capture local primitives by copying, and capture
local non-primitives as (`final`) references.
[Python](https://docs.python.org/3.7/reference/expressions.html#lambda) and
[JavaScript](https://javascriptweblog.wordpress.com/2010/10/25/understanding-javascript-closures/)
both bind *everything* by reference normally, but Python can also
[capture values](https://stackoverflow.com/a/235764/1454178) and JavaScript has
[Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions).

In Rust, arguments to closures are the same as arguments to other functions;
closures are simply functions that don't have a declared name. Some weird ordering
of the stack may be required to handle them, but it's the compiler's responsiblity
to figure it out.

Each example below has the same effect, but compile to very different programs.
In the simplest case, we immediately run a closure returned by another function.
Because we don't store a reference to the closure, the stack memory needed to
store the captured values is contiguous:

```rust
fn my_func() -> impl FnOnce() {
    let x = 24;
    // Note that this closure in assembly looks exactly like
    // any other function; you even use the `call` instruction
    // to start running it.
    move || { x; }
}

pub fn immediate() {
    my_func()();
    my_func()();
}
```
-- [Compiler Explorer](https://godbolt.org/z/mgJ2zl), 25 total assembly instructions

If we store a reference to the bound closure though, the Rust compiler has to
work a bit harder to make sure everything is correctly laid out in stack memory:

```rust
pub fn simple_reference() {
    let x = my_func();
    let y = my_func();
    y();
    x();
}
```
-- [Compiler Explorer](https://godbolt.org/z/K_dj5n), 55 total assembly instructions

In more complex cases, even things like variable order matter:

```rust
pub fn complex() {
    let x = my_func();
    let y = my_func();
    x();
    y();
}
```
-- [Compiler Explorer](https://godbolt.org/z/p37qFl), 70 total assembly instructions

In every circumstance though, the compiler ensured that no heap allocations were necessary.

## Generics

# A Heaping Helping: Rust and Dynamic Memory

Opening question: How many allocations happen before `fn main()` is called?

Now, one question I hope you're asking is "how do we distinguish stack- and
heap-based allocations in Rust code?" There are two strategies I'm going
to use for this:

Summary section:

- Smart pointers hold their contents in the heap
- Collections are smart pointers for many objects at a time, and reallocate
  when they need to grow
- Boxed closures (FnBox, others?) are heap allocated
- "Move" semantics don't trigger new allocation; just a change of ownership,
  so are incredibly fast
- Stack-based alternatives to standard library types should be preferred (spin, parking_lot)