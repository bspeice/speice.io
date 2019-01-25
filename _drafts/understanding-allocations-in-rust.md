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
  and address (pun intended) "release" mode at the end (`cargo run --release` and `cargo test --release`).
- All content will be run using Rust 1.31, as that's the highest currently supported in the
  [Compiler Exporer](https://godbolt.org/). As such, we'll avoid talking about things like
  [compile-time evaluation of `static`](https://github.com/rust-lang/rfcs/blob/master/text/0911-const-fn.md)
  that are available in nightly.
- Because of the nature of the content, some (very simple) assembly-level code is involved.
  We'll keep this to a minimum, but I [needed](https://stackoverflow.com/a/4584131/1454178)
  a [refresher](https://stackoverflow.com/a/26026278/1454178) on the `push` and `pop`
  [instructions](http://www.cs.virginia.edu/~evans/cs216/guides/x86.html)
  while writing this post.

And finally, I'll do what I can to flag potential future changes, but the Rust docs
have a notice worth repeating:

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

## **const** and **static**: Program Allocations

The first memory type we'll look at is pretty special: when Rust can prove that
a *value* is fixed for the life of a program, and when a *reference* is valid for
the duration of the program (`static`, not specifically `'static`).
Understanding the distinction between value and reference is important for reasons
we'll go into below. The
[full specification](https://github.com/rust-lang/rfcs/blob/master/text/0246-const-vs-static.md)
for these two memory types is available, but we'll take a hands-on approach to the topic.

### **const**

The quick summary is this: `const` declares a read-only block of memory that is loaded
as part of your program binary (during the call to [exec(3)](https://linux.die.net/man/3/exec)).
Any `const` value resulting from calling a `const fn` is guaranteed to be materialized
at compile-time (meaning that access at runtime will not invoke the `const fn`),
even though the `const fn` functions are available at run-time as well. The compiler
can choose to copy the constant value wherever it is deemed practical. Getting the address
of a `const` value is legal, but not guaranteed to be the same even when referring to the
same named identifier.

The first point is a bit strange - "read-only memory".
[The Rust book](https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html#differences-between-variables-and-constants)
mentions in a couple places that using `mut` with constants is illegal,
but it's also important to demonstrate just how immutable they are. *Typically* in Rust
you can use "inner mutability" to modify things that aren't declared `mut`.
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

When the [`const` specification](https://github.com/rust-lang/rfcs/blob/26197104b7bb9a5a35db243d639aee6e46d35d75/text/0246-const-vs-static.md)
refers to ["rvalues"](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2010/n3055.pdf), this is
what they mean. [Clippy](https://github.com/rust-lang/rust-clippy) will treat this as an error,
but it's still something to be aware of.

The next thing to mention is that `const` values are loaded into memory *as part of your program binary*.
Because of this, any `const` values declared in your program will be "realized" at compile-time;
accessing them may trigger a main-memory lookup (with a fixed address, so your CPU may
be able to prefetch the value), but that's it.

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
-- [Compiler Explorer](https://odbolt.org/z/Qc7tHM)

In this example, the `FACTOR` value is turned into the `mov edi, 1000` instruction
in both the `multiply` and `multiply_twice` functions; the "1000" value is never
"stored" anywhere, as it's small enough to inline into the assembly instructions.

Finally, getting the address of a `const` value is possible but not guaranteed
to be unique (given that the compiler can choose to copy values). In my testing
I was never able to get the compiler to copy a `const` value and get differing pointers,
but the specifications are clear enough: *don't rely on pointers to `const`
values being consistent*. To be frank, caring about locations for `const` values
is almost certainly a code smell.

### **static**

Static variables are related to `const` variables, but take a slightly different approach.
When the compiler can guarantee that a *reference* is fixed for the life of a program,
you end up with a `static` variable (as opposed to *values* that are fixed for the
duration a program is running). Because of this reference/value distinction, 
static variables behave much more like what people expect from "global" variables.
We'll look at regular static variables first, and then address the `lazy_static!()`
and `thread_local!()` macros later.

More generally, `static` variables are globally unique locations in memory,
the contents of which are loaded as part of your program being read into main memory.
They allow initialization with both raw values and `const fn` calls, and the initial
value is loaded along with the program/library binary. All static variables must
be of a type that implements the [`Sync`](https://doc.rust-lang.org/std/marker/trait.Sync.html)
marker trait. And while `static mut` variables are allowed, mutating a static is considered
an `unsafe` operation.

The single biggest difference between `const` and `static` is the guarantees
provided about uniqueness. Where `const` variables may or may not be copied
in code, `static` variables are guarantee to be unique. If we take a previous
`const` example and change it to `static`, the difference should be clear:

```rust
static FACTOR: u32 = 1000;

pub fn multiply(value: u32) -> u32 {
    value * FACTOR
}

pub fn multiply_twice(value: u32) -> u32 {
    value * FACTOR * FACTOR
}
```
-- [Compiler Explorer](https://godbolt.org/z/MGBr5Y)

Where [previously](https://godbolt.org/z/MGBr5Y) there were plenty of
references to multiplying by 1000, the new assembly refers to `FACTOR`
as a named memory location instead. No initialization work needs to be done,
but the compiler can no longer prove the value never changes during execution.

Next, let's talk about initialization. The simplest case is initializing
static variables with either scalar or struct notation:

```rust
#[derive(Debug)]
struct MyStruct {
    x: u32
}

static MY_STRUCT: MyStruct = MyStruct {
    // You can even reference other statics
    // declared later
    x: MY_VAL
};

static MY_VAL: u32 = 24;

fn main() {
    println!("Static MyStruct: {:?}", MY_STRUCT);
}
```
-- [Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=b538dbc46076f12db047af4f4403ee6e)

Things get a bit weirder when using `const fn`. In most cases, things just work:

```rust
#[derive(Debug)]
struct MyStruct {
    x: u32
}

impl MyStruct {
    const fn new() -> MyStruct {
        MyStruct { x: 24 }
    }
}

static MY_STRUCT: MyStruct = MyStruct::new();

fn main() {
    println!("const fn Static MyStruct: {:?}", MY_STRUCT);
}
```
-- [Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=8c796a6e7fc273c12115091b707b0255)

However, there's a caveat: you're currently not allowed to use `const fn` to initialize
static variables of types that aren't marked `Sync`. As an example, even though
[`RefCell::new()`](https://doc.rust-lang.org/std/cell/struct.RefCell.html#method.new)
is `const fn`, because [`RefCell` isn't `Sync`](https://doc.rust-lang.org/std/cell/struct.RefCell.html#impl-Sync),
you'll get an error at compile time:

```rust
use std::cell::RefCell;

// error[E0277]: `std::cell::RefCell<u8>` cannot be shared between threads safely
static MY_LOCK: RefCell<u8> = RefCell::new(0);
```
-- [Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=c76ef86e473d07117a1700e21fd45560)

It's likely that this will [change in the future](https://github.com/rust-lang/rfcs/blob/master/text/0911-const-fn.md) though,
so be on the lookout.

Which leads well to the next point: static variable types must implement the
[`Sync` marker](https://doc.rust-lang.org/std/marker/trait.Sync.html).
Because they're globally unique, it must be safe for you to access static variables
from any thread at any time. Most `struct` definitions automatically implement the
`Sync` trait because they contain only elements which themselves
implement `Sync`. This is why earlier examples could get away with initializing
statics, even though we never included an `impl Sync for MyStruct` in the code.
For more on the `Sync` trait, the [Nomicon](https://doc.rust-lang.org/nomicon/send-and-sync.html)
has a much more thorough treatment. But as an example, Rust refuses to compile
our earlier example if we add a non-`Sync` element to the `struct` definition:

```rust
use std::cell::RefCell;

struct MyStruct {
    x: u32,
    y: RefCell<u8>,
}

// error[E0277]: `std::cell::RefCell<u8>` cannot be shared between threads safely
static MY_STRUCT: MyStruct = MyStruct {
    x: 8,
    y: RefCell::new(8)
};
```
-- [Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=40074d0248f056c296b662dbbff97cfc)

Finally, while `static mut` variables are allowed, mutating them is an `unsafe` operation.
Unlike `const` however, interior mutability is acceptable. To demonstrate:

```rust
use std::sync::Once;

// This example adapted from https://doc.rust-lang.org/std/sync/struct.Once.html#method.call_once
static INIT: Once = Once::new();

fn main() {
    // Note that while `INIT` is declared immutable, we're still allowed
    // to mutate its interior
    INIT.call_once(|| println!("Initializing..."));
    // This code won't panic, as the interior of INIT was modified
    // as part of the previous `call_once`
    INIT.call_once(|| panic!("INIT was called twice!"));
}
```
-- [Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=3ba003a981a7ed7400240caadd384d59)

## **push** and **pop**: Stack Allocations

**const** and **static** are perfectly fine, but it's very rare that we know
at compile-time about either references or values that will be the same for the entire
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
And when you're finished with memory, the `pop` instruction likewise runs in
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

But no matter how sophisticated your allocator is, the principle remains: the
fastest allocator is the one you never use. As such, we're not going to go
in detail on how exactly the
[`push` and `pop` instructions work](http://www.cs.virginia.edu/~evans/cs216/guides/x86.html),
and we'll focus instead on the conditions that enable the Rust compiler to use
stack-based allocation for variables.

Now, one question I hope you're asking is "how do we distinguish stack- and
heap-based allocations in Rust code?" There are three strategies I'm going
to use for this:

1. Any time the `push` or `pop` instructions are used, or the `rsp` register is modified,
   this is a stack allocation:
   ```rust
   pub fn stack_alloc(x: u32) -> u32 {
       // Space for `y` is allocated by subtracting from `rsp`,
       // and then populated
       let y = [1u8, 2, 3, 4];
       // Space for `y` is deallocated by adding back to `rsp`
       x
   }
   ```
   -- [Compiler Explorer](https://godbolt.org/z/gKFOgB)
2. Any time `call core::ptr::drop_in_place` occurs, a heap allocation has occurred
   sometime in the past and it is now time for us to de-allocate the memory:
   ```rust
   pub fn heap_alloc(x: usize) -> usize {
       // Space for elements in a vector has to be allocated
       // on the heap, and is then de-allocated once the
       // vector goes out of scope
       let y: Vec<u8> = Vec::with_capacity(x);
       x
   }
   ```
   -- [Compiler Explorer](https://godbolt.org/z/T2xoh8) (`drop_in_place` happens on line 1321)
3. Using a special [`GlobalAlloc`](https://doc.rust-lang.org/std/alloc/trait.GlobalAlloc.html)
   implementation to track when heap allocations occur. For this post, I'll be using
   [qadapt](https://crates.io/crates/qadapt) to trigger a panic if heap allocations
   occur; code that doesn't panic doesn't use heap allocations, and by necessity
   uses stack allocation instead.

With all that in mind, let's get into the details. The unfortunate thing about stack allocations
in Rust is that there's not a good
way to glance at code and figure out where allocations on the heap happen. Looking at
other languages, Java mostly cares about `new MyObject()` (yes, I'm conveniently ignoring
autoboxing). C makes things clear with calls to [malloc(3)](https://linux.die.net/man/3/malloc),
and old C++ has the [new](https://stackoverflow.com/a/655086/1454178) keyword.
Rust's model most closely aligns with C++11 and [RAII](https://en.cppreference.com/w/cpp/language/raii);
[`Box`](https://doc.rust-lang.org/stable/alloc/boxed/struct.Box.html)
is comparable to [`std::make_unique()`](https://en.cppreference.com/w/cpp/memory/unique_ptr/make_unique),
and [`Rc`](https://doc.rust-lang.org/stable/alloc/rc/struct.Rc.html) behaves like
[`std::make_shared()`](https://en.cppreference.com/w/cpp/memory/shared_ptr/make_shared).

But what can be done to ensure your program is using stack allocations? Some guidelines
are in order:

**For code you control**:

- Don't use smart pointer types, as they force heap allocation -
  [`Box`](https://doc.rust-lang.org/stable/alloc/boxed/struct.Box.html),
  [`Rc`](https://doc.rust-lang.org/stable/alloc/rc/struct.Rc.html), etc.
- Cloning or copying stack-allocated objects creates new objects that are
  stack-allocated.
- Enums and other wrapper types will not trigger heap allocations unless
  their contents need heap allocation. You can use
  [`Option`](https://doc.rust-lang.org/stable/core/option/enum.Option.html) and
  [`RefCell`](https://doc.rust-lang.org/stable/core/cell/struct.RefCell.html)
  with reckless abandon.
- [Arrays](https://doc.rust-lang.org/std/primitive.array.html) are guaranteed
  to be stack-allocated, but dynamically resizable types (
  [`String`](https://doc.rust-lang.org/stable/alloc/string/struct.String.html),
  [`Vec`](https://doc.rust-lang.org/stable/alloc/vec/struct.Vec.html),
  [`HashMap`](https://doc.rust-lang.org/stable/std/collections/struct.HashMap.html))
  will store their contents in the heap
- Note to self: Do I need to mention generics or trait objects? I think this
  may be handled by the other points, and can be addressed later. Also, is it
  obvious that cloning stack-allocated data puts things on the stack? Is there
  a way to address that without it being a unique point?

**For code outside your control**: (crates you rely on)

- Review the code to make sure it abides by the guidelines above
- Use a custom allocator like [qadapt](https://crates.io/crates/qadapt) as an automated check
  to make sure that stack allocations are used in code you care about.


Example: Why doesn't `Vec::new()` go to the allocator?

Questions:

1. What is the "Push" instruction? Why do we like the stack?
2. How does Rust allocate arguments to the function?
3. How does Rust allocate variables created in the function but never returned?
4. How does Rust allocate variables created in the function and returned?
5. How do Option<> or Result<> affect structs?
6. How are arrays allocated?
7. Legal to pass an array as an argument?
8. Can you force a heap allocation with arrays that are larger than stack size?
    - Check `ulimit -s`
    - Are array implementations larger than 32 needed? 32 x u64 == 256 bytes
9. Can you force heap allocation by returning something that escapes the stack?
    - Will `#[inline(always)]` move this back to a stack allocation?
    - Will `#[inline(never)]` force a heap allocation?

# Piling On - Rust and the Heap

Example: How to trigger a heap allocation

Questions:

1. Where do collection types allocate memory?
2. Does a Box<> always allocate heap?
    - Yes, with exception of compiler optimizations
3. Passing Box<Trait> vs. genericizing/monomorphization
    - If it uses `dyn Trait`, it's on the heap?
    - What if the trait implements `Sized`?
4. Other pointer types? Do Rc<>/Arc<> force heap allocation?
    - Maybe? Part of the alloc crate, but should use qadapt to check
5. How many allocations happen before `main()` is called?
6. How can you use the heap well?
    - Know when collections resizing happens
    - Use `Borrow` to abstract over Pointer/Box/Rc/Arc/CoW
7. How expensive is move? Vs. C++ std::move?

# Compiler Optimizations Make Everything Complicated

1. Box<> getting inlined into stack allocations
2. Vec::push() === Vec::with_capacity() for fixed/predictable capacities
3. Inlining statics that don't change value

# Appendix and Further Reading

[embedonomicon]: https://docs.rust-embedded.org/embedonomicon/
[libc]: CRATES.IO LINK
[winapi]: CRATES.IO LINK
[malloc]: MANPAGE LINK