---
layout: post
title: "Fixed Memory: Stacking Up"
description: "We don't need no allocator."
category:
tags: [rust, understanding-allocations]
---

`const` and `static` are perfectly fine, but it's relatively rare that we know at compile-time about
either values or references that will be the same for the duration of our program. Put another way,
it's not often the case that either you or your compiler knows how much memory your entire program
will ever need.

However, there are still some optimizations the compiler can do if it knows how much memory
individual functions will need. Specifically, the compiler can make use of "stack" memory (as
opposed to "heap" memory) which can be managed far faster in both the short- and long-term. When
requesting memory, the [`push` instruction](http://www.cs.virginia.edu/~evans/cs216/guides/x86.html)
can typically complete in [1 or 2 cycles](https://agner.org/optimize/instruction_tables.ods) (<1
nanosecond on modern CPUs). Contrast that to heap memory which requires an allocator (specialized
software to track what memory is in use) to reserve space. When you're finished with stack memory,
the `pop` instruction runs in 1-3 cycles, as opposed to an allocator needing to worry about memory
fragmentation and other issues with the heap. All sorts of incredibly sophisticated techniques have
been used to design allocators:

- [Garbage Collection](<https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)>)
  strategies like [Tracing](https://en.wikipedia.org/wiki/Tracing_garbage_collection) (used in
  [Java](https://www.oracle.com/technetwork/java/javase/tech/g1-intro-jsp-135488.html)) and
  [Reference counting](https://en.wikipedia.org/wiki/Reference_counting) (used in
  [Python](https://docs.python.org/3/extending/extending.html#reference-counts))
- Thread-local structures to prevent locking the allocator in
  [tcmalloc](https://jamesgolick.com/2013/5/19/how-tcmalloc-works.html)
- Arena structures used in [jemalloc](http://jemalloc.net/), which
  [until recently](https://blog.rust-lang.org/2019/01/17/Rust-1.32.0.html#jemalloc-is-removed-by-default)
  was the primary allocator for Rust programs!

But no matter how fast your allocator is, the principle remains: the fastest allocator is the one
you never use. As such, we're not going to discuss how exactly the
[`push` and `pop` instructions work](http://www.cs.virginia.edu/~evans/cs216/guides/x86.html), but
we'll focus instead on the conditions that enable the Rust compiler to use faster stack-based
allocation for variables.

So, **how do we know when Rust will or will not use stack allocation for objects we create?**
Looking at other languages, it's often easy to delineate between stack and heap. Managed memory
languages (Python, Java,
[C#](https://blogs.msdn.microsoft.com/ericlippert/2010/09/30/the-truth-about-value-types/)) place
everything on the heap. JIT compilers ([PyPy](https://www.pypy.org/),
[HotSpot](https://www.oracle.com/technetwork/java/javase/tech/index-jsp-136373.html)) may optimize
some heap allocations away, but you should never assume it will happen. C makes things clear with
calls to special functions (like [malloc(3)](https://linux.die.net/man/3/malloc)) needed to access
heap memory. Old C++ has the [`new`](https://stackoverflow.com/a/655086/1454178) keyword, though
modern C++/C++11 is more complicated with [RAII](https://en.cppreference.com/w/cpp/language/raii).

For Rust, we can summarize as follows: **stack allocation will be used for everything that doesn't
involve "smart pointers" and collections**. We'll skip over a precise definition of the term "smart
pointer" for now, and instead discuss what we should watch for to understand when stack and heap
memory regions are used:

1. Stack manipulation instructions (`push`, `pop`, and `add`/`sub` of the `rsp` register) indicate
   allocation of stack memory:

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

2. Tracking when exactly heap allocation calls occur is difficult. It's typically easier to watch
   for `call core::ptr::real_drop_in_place`, and infer that a heap allocation happened in the recent
   past:

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
   <span style="font-size: .8em">Note: While the
   [`Drop` trait](https://doc.rust-lang.org/std/ops/trait.Drop.html) is
   [called for stack-allocated objects](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=87edf374d8983816eb3d8cfeac657b46),
   the Rust standard library only defines `Drop` implementations for types that involve heap
   allocation.</span>

3. If you don't want to inspect the assembly, use a custom allocator that's able to track and alert
   when heap allocations occur. Crates like
   [`alloc_counter`](https://crates.io/crates/alloc_counter) are designed for exactly this purpose.

With all that in mind, let's talk about situations in which we're guaranteed to use stack memory:

- Structs are created on the stack.
- Function arguments are passed on the stack, meaning the
  [`#[inline]` attribute](https://doc.rust-lang.org/reference/attributes.html#inline-attribute) will
  not change the memory region used.
- Enums and unions are stack-allocated.
- [Arrays](https://doc.rust-lang.org/std/primitive.array.html) are always stack-allocated.
- Closures capture their arguments on the stack.
- Generics will use stack allocation, even with dynamic dispatch.
- [`Copy`](https://doc.rust-lang.org/std/marker/trait.Copy.html) types are guaranteed to be
  stack-allocated, and copying them will be done in stack memory.
- [`Iterator`s](https://doc.rust-lang.org/std/iter/trait.Iterator.html) in the standard library are
  stack-allocated even when iterating over heap-based collections.

# Structs

The simplest case comes first. When creating vanilla `struct` objects, we use stack memory to hold
their contents:

```rust
struct Point {
    x: u64,
    y: u64,
}

struct Line {
    a: Point,
    b: Point,
}

pub fn make_line() {
    // `origin` is stored in the first 16 bytes of memory
    // starting at location `rsp`
    let origin = Point { x: 0, y: 0 };
    // `point` makes up the next 16 bytes of memory
    let point = Point { x: 1, y: 2 };

    // When creating `ray`, we just move the content out of
    // `origin` and `point` into the next 32 bytes of memory
    let ray = Line { a: origin, b: point };
}
```

-- [Compiler Explorer](https://godbolt.org/z/vri9BE)

Note that while some extra-fancy instructions are used for memory manipulation in the assembly, the
`sub rsp, 64` instruction indicates we're still working with the stack.

# Function arguments

Have you ever wondered how functions communicate with each other? Like, once the variables are given
to you, everything's fine. But how do you "give" those variables to another function? How do you get
the results back afterward? The answer: the compiler arranges memory and assembly instructions using
a pre-determined [calling convention](http://llvm.org/docs/LangRef.html#calling-conventions). This
convention governs the rules around where arguments needed by a function will be located (either in
memory offsets relative to the stack pointer `rsp`, or in other registers), and where the results
can be found once the function has finished. And when multiple languages agree on what the calling
conventions are, you can do things like having [Go call Rust code](https://blog.filippo.io/rustgo/)!

Put simply: it's the compiler's job to figure out how to call other functions, and you can assume
that the compiler is good at its job.

We can see this in action using a simple example:

```rust
struct Point {
    x: i64,
    y: i64,
}

// We use integer division operations to keep
// the assembly clean, understanding the result
// isn't accurate.
fn distance(a: &Point, b: &Point) -> i64 {
    // Immediately subtract from `rsp` the bytes needed
    // to hold all the intermediate results - this is
    // the stack allocation step

    // The compiler used the `rdi` and `rsi` registers
    // to pass our arguments, so read them in
    let x1 = a.x;
    let x2 = b.x;
    let y1 = a.y;
    let y2 = b.y;

    // Do the actual math work
    let x_pow = (x1 - x2) * (x1 - x2);
    let y_pow = (y1 - y2) * (y1 - y2);
    let squared = x_pow + y_pow;
    squared / squared

    // Our final result will be stored in the `rax` register
    // so that our caller knows where to retrieve it.
    // Finally, add back to `rsp` the stack memory that is
    // now ready to be used by other functions.
}

pub fn total_distance() {
    let start = Point { x: 1, y: 2 };
    let middle = Point { x: 3, y: 4 };
    let end = Point { x: 5, y: 6 };

    let _dist_1 = distance(&start, &middle);
    let _dist_2 = distance(&middle, &end);
}
```

-- [Compiler Explorer](https://godbolt.org/z/Qmx4ST)

As a consequence of function arguments never using heap memory, we can also infer that functions
using the `#[inline]` attributes also do not heap allocate. But better than inferring, we can look
at the assembly to prove it:

```rust
struct Point {
    x: i64,
    y: i64,
}

// Note that there is no `distance` function in the assembly output,
// and the total line count goes from 229 with inlining off
// to 306 with inline on. Even still, no heap allocations occur.
#[inline(always)]
fn distance(a: &Point, b: &Point) -> i64 {
    let x1 = a.x;
    let x2 = b.x;
    let y1 = a.y;
    let y2 = b.y;

    let x_pow = (a.x - b.x) * (a.x - b.x);
    let y_pow = (a.y - b.y) * (a.y - b.y);
    let squared = x_pow + y_pow;
    squared / squared
}

pub fn total_distance() {
    let start = Point { x: 1, y: 2 };
    let middle = Point { x: 3, y: 4 };
    let end = Point { x: 5, y: 6 };

    let _dist_1 = distance(&start, &middle);
    let _dist_2 = distance(&middle, &end);
}
```

-- [Compiler Explorer](https://godbolt.org/z/30Sh66)

Finally, passing by value (arguments with type
[`Copy`](https://doc.rust-lang.org/std/marker/trait.Copy.html)) and passing by reference (either
moving ownership or passing a pointer) may have slightly different layouts in assembly, but will
still use either stack memory or CPU registers:

```rust
pub struct Point {
    x: i64,
    y: i64,
}

// Moving values
pub fn distance_moved(a: Point, b: Point) -> i64 {
    let x1 = a.x;
    let x2 = b.x;
    let y1 = a.y;
    let y2 = b.y;

    let x_pow = (x1 - x2) * (x1 - x2);
    let y_pow = (y1 - y2) * (y1 - y2);
    let squared = x_pow + y_pow;
    squared / squared
}

// Borrowing values has two extra `mov` instructions on lines 21 and 22
pub fn distance_borrowed(a: &Point, b: &Point) -> i64 {
    let x1 = a.x;
    let x2 = b.x;
    let y1 = a.y;
    let y2 = b.y;

    let x_pow = (x1 - x2) * (x1 - x2);
    let y_pow = (y1 - y2) * (y1 - y2);
    let squared = x_pow + y_pow;
    squared / squared
}
```

-- [Compiler Explorer](https://godbolt.org/z/06hGiv)

# Enums

If you've ever worried that wrapping your types in
[`Option`](https://doc.rust-lang.org/stable/core/option/enum.Option.html) or
[`Result`](https://doc.rust-lang.org/stable/core/result/enum.Result.html) would finally make them
large enough that Rust decides to use heap allocation instead, fear no longer: `enum` and union
types don't use heap allocation:

```rust
enum MyEnum {
    Small(u8),
    Large(u64)
}

struct MyStruct {
    x: MyEnum,
    y: MyEnum,
}

pub fn enum_compare() {
    let x = MyEnum::Small(0);
    let y = MyEnum::Large(0);

    let z = MyStruct { x, y };

    let opt = Option::Some(z);
}
```

-- [Compiler Explorer](https://godbolt.org/z/HK7zBx)

Because the size of an `enum` is the size of its largest element plus a flag, the compiler can
predict how much memory is used no matter which variant of an enum is currently stored in a
variable. Thus, enums and unions have no need of heap allocation. There's unfortunately not a great
way to show this in assembly, so I'll instead point you to the
[`core::mem::size_of`](https://doc.rust-lang.org/stable/core/mem/fn.size_of.html#size-of-enums)
documentation.

# Arrays

The array type is guaranteed to be stack allocated, which is why the array size must be declared.
Interestingly enough, this can be used to cause safe Rust programs to crash:

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
    // (like the current function call stack), allocating another
    // eight megabytes of stack memory crashes the program
    let _x = EightM::default();
}
```

--
[Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=587a6380a4914bcbcef4192c90c01dc4)

There aren't any security implications of this (no memory corruption occurs), but it's good to note
that the Rust compiler won't move arrays into heap memory even if they can be reasonably expected to
overflow the stack.

# Closures

Rules for how anonymous functions capture their arguments are typically language-specific. In Java,
[Lambda Expressions](https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html) are
actually objects created on the heap that capture local primitives by copying, and capture local
non-primitives as (`final`) references.
[Python](https://docs.python.org/3.7/reference/expressions.html#lambda) and
[JavaScript](https://javascriptweblog.wordpress.com/2010/10/25/understanding-javascript-closures/)
both bind _everything_ by reference normally, but Python can also
[capture values](https://stackoverflow.com/a/235764/1454178) and JavaScript has
[Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions).

In Rust, arguments to closures are the same as arguments to other functions; closures are simply
functions that don't have a declared name. Some weird ordering of the stack may be required to
handle them, but it's the compiler's responsiblity to figure that out.

Each example below has the same effect, but a different assembly implementation. In the simplest
case, we immediately run a closure returned by another function. Because we don't store a reference
to the closure, the stack memory needed to store the captured values is contiguous:

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

If we store a reference to the closure, the Rust compiler keeps values it needs in the stack memory
of the original function. Getting the details right is a bit harder, so the instruction count goes
up even though this code is functionally equivalent to our original example:

```rust
pub fn simple_reference() {
    let x = my_func();
    let y = my_func();
    y();
    x();
}
```

-- [Compiler Explorer](https://godbolt.org/z/K_dj5n), 55 total assembly instructions

Even things like variable order can make a difference in instruction count:

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

# Generics

Traits in Rust come in two broad forms: static dispatch (monomorphization, `impl Trait`) and dynamic
dispatch (trait objects, `dyn Trait`). While dynamic dispatch is often _associated_ with trait
objects being stored in the heap, dynamic dispatch can be used with stack allocated objects as well:

```rust
trait GetInt {
    fn get_int(&self) -> u64;
}

// vtable stored at section L__unnamed_1
struct WhyNotU8 {
    x: u8
}
impl GetInt for WhyNotU8 {
    fn get_int(&self) -> u64 {
        self.x as u64
    }
}

// vtable stored at section L__unnamed_2
struct ActualU64 {
    x: u64
}
impl GetInt for ActualU64 {
    fn get_int(&self) -> u64 {
        self.x
    }
}

// `&dyn` declares that we want to use dynamic dispatch
// rather than monomorphization, so there is only one
// `retrieve_int` function that shows up in the final assembly.
// If we used generics, there would be one implementation of
// `retrieve_int` for each type that implements `GetInt`.
pub fn retrieve_int(u: &dyn GetInt) {
    // In the assembly, we just call an address given to us
    // in the `rsi` register and hope that it was set up
    // correctly when this function was invoked.
    let x = u.get_int();
}

pub fn do_call() {
    // Note that even though the vtable for `WhyNotU8` and
    // `ActualU64` includes a pointer to
    // `core::ptr::real_drop_in_place`, it is never invoked.
    let a = WhyNotU8 { x: 0 };
    let b = ActualU64 { x: 0 };

    retrieve_int(&a);
    retrieve_int(&b);
}
```

-- [Compiler Explorer](https://godbolt.org/z/u_yguS)

It's hard to imagine practical situations where dynamic dispatch would be used for objects that
aren't heap allocated, but it technically can be done.

# Copy types

Understanding move semantics and copy semantics in Rust is weird at first. The Rust docs
[go into detail](https://doc.rust-lang.org/stable/core/marker/trait.Copy.html) far better than can
be addressed here, so I'll leave them to do the job. From a memory perspective though, their
guideline is reasonable:
[if your type can implemement `Copy`, it should](https://doc.rust-lang.org/stable/core/marker/trait.Copy.html#when-should-my-type-be-copy).
While there are potential speed tradeoffs to _benchmark_ when discussing `Copy` (move semantics for
stack objects vs. copying stack pointers vs. copying stack `struct`s), _it's impossible for `Copy`
to introduce a heap allocation_.

But why is this the case? Fundamentally, it's because the language controls what `Copy` means -
["the behavior of `Copy` is not overloadable"](https://doc.rust-lang.org/std/marker/trait.Copy.html#whats-the-difference-between-copy-and-clone)
because it's a marker trait. From there we'll note that a type
[can implement `Copy`](https://doc.rust-lang.org/std/marker/trait.Copy.html#when-can-my-type-be-copy)
if (and only if) its components implement `Copy`, and that
[no heap-allocated types implement `Copy`](https://doc.rust-lang.org/std/marker/trait.Copy.html#implementors).
Thus, assignments involving heap types are always move semantics, and new heap allocations won't
occur because of implicit operator behavior.

```rust
#[derive(Clone)]
struct Cloneable {
    x: Box<u64>
}

// error[E0204]: the trait `Copy` may not be implemented for this type
#[derive(Copy, Clone)]
struct NotCopyable {
    x: Box<u64>
}
```

-- [Compiler Explorer](https://godbolt.org/z/VToRuK)

# Iterators

In managed memory languages (like
[Java](https://www.youtube.com/watch?v=bSkpMdDe4g4&feature=youtu.be&t=357)), there's a subtle
difference between these two code samples:

```java
public static int sum_for(List<Long> vals) {
    long sum = 0;
    // Regular for loop
    for (int i = 0; i < vals.length; i++) {
        sum += vals[i];
    }
    return sum;
}

public static int sum_foreach(List<Long> vals) {
    long sum = 0;
    // "Foreach" loop - uses iteration
    for (Long l : vals) {
        sum += l;
    }
    return sum;
}
```

In the `sum_for` function, nothing terribly interesting happens. In `sum_foreach`, an object of type
[`Iterator`](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/Iterator.html)
is allocated on the heap, and will eventually be garbage-collected. This isn't a great design;
iterators are often transient objects that you need during a function and can discard once the
function ends. Sounds exactly like the issue stack-allocated objects address, no?

In Rust, iterators are allocated on the stack. The objects to iterate over are almost certainly in
heap memory, but the iterator itself
([`Iter`](https://doc.rust-lang.org/std/slice/struct.Iter.html)) doesn't need to use the heap. In
each of the examples below we iterate over a collection, but never use heap allocation:

```rust
use std::collections::HashMap;
// There's a lot of assembly generated, but if you search in the text,
// there are no references to `real_drop_in_place` anywhere.

pub fn sum_vec(x: &Vec<u32>) {
    let mut s = 0;
    // Basic iteration over vectors doesn't need allocation
    for y in x {
        s += y;
    }
}

pub fn sum_enumerate(x: &Vec<u32>) {
    let mut s = 0;
    // More complex iterators are just fine too
    for (_i, y) in x.iter().enumerate() {
        s += y;
    }
}

pub fn sum_hm(x: &HashMap<u32, u32>) {
    let mut s = 0;
    // And it's not just Vec, all types will allocate the iterator
    // on stack memory
    for y in x.values() {
        s += y;
    }
}
```

-- [Compiler Explorer](https://godbolt.org/z/FTT3CT)
