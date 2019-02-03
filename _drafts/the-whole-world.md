---
layout: post
title: "The Whole World: Global Memory Usage"
description: "Static considered slightly less harmful"
category: 
tags: [rust, understanding-allocations]
---

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
-- [Compiler Explorer](https://godbolt.org/z/2KXUcN)

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
-- [Compiler Explorer](https://godbolt.org/z/_JiT9O)

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
-- [Compiler Explorer](https://godbolt.org/z/bSfBxn)

Where [previously](https://godbolt.org/z/_JiT90) there were plenty of
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

It's likely that this will [change in the future](https://github.com/rust-lang/rfcs/blob/master/text/0911-const-fn.md) though.

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

