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
- [The Whole World: Global Memory Usage](#the-whole-world-global-memory-usage)
- [Stacking Up: Non-Heap Memory](#stacking-up-non-heap-memory)
- [A Heaping Helping: Rust and Dynamic Memory](#a-heaping-helping-rust-and-dynamic-memory)
- [Compiler Optimizations: What It's Done For You Lately](#compiler-optimizations-what-its-done-for-you-lately)
- Summary: When Does Rust Allocate?

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
- All content will be run using Rust 1.31, as that's the highest currently supported in the
  [Compiler Exporer](https://godbolt.org/). As such, we'll avoid upcoming innovations like
  [compile-time evaluation of `static`](https://github.com/rust-lang/rfcs/blob/master/text/0911-const-fn.md)
  that are available in nightly.
- Because of the nature of the content, some (very simple) assembly-level code is involved.
  We'll keep this simple, but I [found](https://stackoverflow.com/a/4584131/1454178)
  a [refresher](https://stackoverflow.com/a/26026278/1454178) on the `push` and `pop`
  [instructions](http://www.cs.virginia.edu/~evans/cs216/guides/x86.html)
  was helpful while writing this post.

Finally, I'll do what I can to flag potential future changes but the Rust docs
have a notice worth repeating:

> Rust does not currently have a rigorously and formally defined memory model.
>  
> -- [the docs](https://doc.rust-lang.org/std/ptr/fn.read_volatile.html)

# The Whole World: Global Memory Usage

The first memory type we'll look at is pretty special: when Rust can prove that
a *value* is fixed for the life of a program (`const`), and when a *reference* is valid for
the duration of the program (`static` as a declaration, not
[`'static`](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html#the-static-lifetime)
as a lifetime).
Understanding the distinction between value and reference is important for reasons
we'll go into below. The
[full specification](https://github.com/rust-lang/rfcs/blob/master/text/0246-const-vs-static.md)
for these two memory types is available, but we'll take a hands-on approach to the topic.

## **const**

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

## **static**

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

# Stacking Up: Non-Heap Memory 

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
keyword, though modern C++/C++11 is more complicated with [RAII](https://en.cppreference.com/w/cpp/language/raii)
([`std::make_unique()`](https://en.cppreference.com/w/cpp/memory/unique_ptr/make_unique) and
[`std::make_shared()`](https://en.cppreference.com/w/cpp/memory/shared_ptr/make_shared))

For Rust specifically, the principle is this: *stack allocation will be used for everything
that doesn't involve "smart pointers" and collections.* If we're interested in proving
it though, there are three things to watch for:

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
   -- [Compiler Explorer](https://godbolt.org/z/gKFOgB)

2. Tracking when heap allocation calls happen is difficult. It's typically easier to
   watch for `call core::ptr::drop_in_place`, and infer that a heap allocation happened
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
   -- [Compiler Explorer](https://godbolt.org/z/T2xoh8) (`drop_in_place` happens on line 1321)
   <span style="font-size: .8em">Note: While the [`Drop` trait](https://doc.rust-lang.org/std/ops/trait.Drop.html)
   is called for stack-allocated objects, the Rust standard library only defines `Drop` implementations
   for types that involve heap allocation.</span> 

3. If you don't want to inspect the assembly, use a custom allocator that's able to track
   and alert when heap allocations occur. As an unashamed plug, [qadapt](https://crates.io/crates/qadapt)
   was designed for exactly this purpose.

With all that in mind, let's talk about situations in which we're guaranteed to use stack memory:

- Structs not wrapped by smart pointers are created on the stack.
- Enums and unions are stack-allocated.
- [Arrays](https://doc.rust-lang.org/std/primitive.array.html) are always stack-allocated.
- Using the [`#[inline]` attribute](https://doc.rust-lang.org/reference/attributes.html#inline-attribute)
  will not change the memory region used.
- Generics will use stack allocation, even with dynamic dispatch.

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

## Smart pointers and collections

The first thing to note are the "smart pointer" and collections types.
When you have data that must outlive the scope in which it is declared,
or your data is of unknown or dynamic size, you'll make use of these types.

The term [smart pointer](https://en.wikipedia.org/wiki/Smart_pointer)
comes from C++, and is used to describe objects that are responsible for managing
ownership of data allocated on the heap. Some familiar smart pointers come from the
low-level `alloc` crate:
- [`Box`](https://doc.rust-lang.org/alloc/boxed/struct.Box.html)
- [`Rc`](https://doc.rust-lang.org/alloc/rc/struct.Rc.html)
- [`Arc`](https://doc.rust-lang.org/alloc/sync/struct.Arc.html)
- [`Cow`](https://doc.rust-lang.org/alloc/borrow/enum.Cow.html)

The [standard library](https://doc.rust-lang.org/std/) also defines some smart pointers,
though more than can be covered in this article. Some examples:
- [`RwLock`](https://doc.rust-lang.org/std/sync/struct.RwLock.html)
- [`Mutex`](https://doc.rust-lang.org/std/sync/struct.Mutex.html)

Finally, there is one [gotcha](https://www.merriam-webster.com/dictionary/gotcha):
[`RefCell`](https://doc.rust-lang.org/stable/core/cell/struct.RefCell.html) looks like
and behaves like a smart pointer, but doesn't actually require heap allocation.

When a smart pointer is created, the data it is given is placed in heap memory and
the location of that data is recorded in the smart pointer. Once the smart pointer
has determined it's safe to deallocate that memory (when a `Box` has
[gone out of scope](https://doc.rust-lang.org/stable/std/boxed/index.html) or when
reference count for an object [goes to zero](https://doc.rust-lang.org/alloc/rc/index.html)),
the heap space is reclaimed. We can prove these types use heap memory by
looking at some quick code:

```rust
use std::rc::Rc;
use std::sync::Arc;
use std::borrow::Cow;

pub fn my_box() {
    // Drop at line 1674
    Box::new(0);
}

pub fn my_rc() {
    // Drop at line 1684
    Rc::new(0);
}

pub fn my_arc() {
    // Drop at line 1694
    Arc::new(0);
}

pub fn my_cow() {
    // Drop at line 1707
    Cow::from("drop");
}
```
-- [Compiler Explorer](https://godbolt.org/z/QOPR4V)

Collections types use heap memory because they have dynamic size; they will request more memory
[when they need it](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.reserve),
and can be [asked to release memory](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.shrink_to_fit)
when it's no longer necessary. This dynamic memory usage forces Rust to use
heap allocations for everything they contain. In a way, collections are smart pointers
for many objects at once. Common types that fall under this umbrella
are `Vec`, `HashMap`, and `String` (not [`&str`](https://doc.rust-lang.org/std/primitive.str.html)).

There's an interesting caveat worth addressing though: *creating empty collections
will not allocate on the heap*. This is a bit weird, because if we call `Vec::new()` the
assembly shows a corresponding call to `drop_in_place`:

```rust
pub fn my_vec() {
    // Drop in place at line 481
    Vec::<u8>::new();
}
```
-- [Compiler Explorer](https://godbolt.org/z/3-Gjqz)

But because the vector has no elements it is managing, no calls to the allocator
will ever be dispatched. A couple of places to look at for confirming this behavior:
[`Vec::new()`](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.new),
[`HashMap::new()`](https://doc.rust-lang.org/std/collections/hash_map/struct.HashMap.html#method.new),
and [`String::new()`](https://doc.rust-lang.org/std/string/struct.String.html#method.new).

# Compiler Optimizations: What It's Done For You Lately

1. Box<> getting inlined into stack allocations
2. Vec::push() === Vec::with_capacity() for fixed/predictable capacities
3. Inlining statics that don't change value

# Appendix and Further Reading

[embedonomicon]: https://docs.rust-embedded.org/embedonomicon/
[libc]: CRATES.IO LINK
[winapi]: CRATES.IO LINK
[malloc]: MANPAGE LINK