---
layout: post
title: "QADAPT - Allocation Safety in Rust"
description: "...and why you want an allocator that goes 💥."
category: 
tags: []
---

I think it's part of the human condition to ignore perfectly good advice when it comes our way.
A bit over a month ago, I was dispensing sage wisdom for the ages:

> I had a really great idea: build a custom allocator that allows you to track
> your own allocations. I gave it a shot, but learned very quickly:
> **never write your own allocator.**
>
> -- [me](/2018/10/case-study-optimization.html)

I proceeded to ignore it, because we never really learn from our mistakes.

There's another part of the human condition that derives joy from seeing things explode.

<iframe src="https://giphy.com/embed/YA6dmVW0gfIw8" width="480" height="336" frameBorder="0"></iframe>

And *that's* the part of the human condition I'm going to focus on.

# Why an Allocator

So why, after complaining about allocators, would I want to go back and write one myself?
There are two reasons for that:

1. **Allocation/dropping is slow**
2. **It's difficult to know when exactly Rust will allocate/drop, especially when using
code that you did not write**

When I say "slow," it's important to define the terms. If you're writing web applications,
you'll spend orders of magnitude more time waiting for the database than you will the allocator.
However, there's still plenty of code where micro- or nano-seconds matter; think finance,
[real-time audio](https://www.reddit.com/r/rust/comments/9hg7yj/synthesizer_progress_update/e6c291f),
[self-driving cars](https://polysync.io/blog/session-types-for-hearty-codecs/), and networking.
In these situations it's simply unacceptable for you to spend time doing things
that are not your program, and waiting on the allocator takes a great deal of time.

Secondly, it can be difficult to predict where exactly allocations will happen in Rust code. We're going
to play a quick trivia game: **Does this code trigger an allocation?**

## Example 1

```rust
fn my_function() {
    let v: Vec<u8> = Vec::new();
}
```

**No**: Rust [knows how big](https://doc.rust-lang.org/std/mem/fn.size_of.html)
the `Vec` type is, and reserves a fixed amount of memory on the stack for the `v` vector.
If we were to reserve extra space (using `Vec::with_capacity`), this would trigger
an allocation.

## Example 2

```rust
fn my_function() {
    let v: Box<Vec<u8>> = Box::new(Vec::new());
}
```

**Yes**: Because Boxes allow us to work with things that are of unknown size, it has to allocate
on the heap even though the vector has a known size at compile time. Some release builds may
optimize out the Box in this specific example, but it's not guaranteed to happen.

## Example 3

```rust
fn my_function(v: Vec<u8>) {
    v.push(5);
}
```

**Maybe**: Depending on whether the Vector we were given has space available, we may or may not allocate.
Especially when dealing with code that you did not author, it's helpful to have a system double-check
that you didn't accidentally introduce an allocation or drop somewhere unintended.

# Blowing Things Up

So, how exactly does QADAPT solve these problems? **Whenever an allocation/drop occurs in code marked
allocation-safe, QADAPT triggers a thread panic.** We don't want to let the program continue as if
nothing strange happened, *we want things to explode*.

However, you don't want code to panic in production because of circumstances you didn't predict.
Just like [`debug_assert!`](https://doc.rust-lang.org/std/macro.debug_assert.html),
QADAPT will strip out its own code when building in release mode to guarantee no panics and
no performance impact.

Finally, there are three ways to have QADAPT check that your code is allocation-free:

## Using a procedural macro

Easiest method, marks an entire function as not allocating/drop safe:

```rust
use qadapt::no_alloc;
use qadapt::QADAPT;

#[global_allocator]
static Q: QADAPT = QADAPT;

#[no_alloc]
fn push_vec(v: &mut Vec<u8>) {
    // This triggers a panic if v.len() == v.capacity()
    v.push(5);
}

fn main() {
    let v = Vec::with_capacity(1);

    // This will *not* trigger a panic
    push_vec(&v);

    // This *will* trigger a panic
    push_vec(&v);
}
```

## Using a regular macro

For times when you need more precision:

```rust
use qadapt::assert_no_alloc;
use qadapt::QADAPT;

#[global_allocator]
static Q: QADAPT = QADAPT;

fn main() {
    let v = Vec::with_capacity(1);

    // No allocations here, we already have space reserved
    assert_no_alloc!(v.push(5));

    // Even though we remove an item, it doesn't trigger a drop
    // because it's a scalar
    assert_no_alloc!({
        let mut x = v.pop().unwrap();
        x += 1;
    });
}
```

## Using function calls

Both the most precise and most tedious method:

```rust
use qadapt::enter_protected;
use qadapt::exit_protected;
use qadapt::QADAPT;

#[global_allocator]
static Q: QADAPT = QADAPT;

fn main() {
    // This triggers an allocation (on non-release builds)
    let v = Vec::with_capacity(1);

    enter_protected();
    // This does not trigger an allocation because we've reserved size
    v.push(0);
    exit_protected();

    // This triggers an allocation because we ran out of size,
    // but doesn't panic because we're no longer protected.
    v.push(1);
}
```

## Caveats

It's important to point out that QADAPT code is synchronous, so please be careful
when mixing in asynchronous functions:

```rust
use futures::future::Future;
use futures::future::ok;

#[no_alloc]
fn async_capacity() -> impl Future<Item=Vec<u8>, Error=()> {
    ok(12).and_then(|e| Ok(Vec::with_capacity(e)))
}

fn main() {
    // This doesn't trigger a panic because the `and_then` closure
    // wasn't run during the function call.
    async_capacity();

    // Still no panic
    assert_no_alloc!(async_capacity());

    // This will panic because the allocation happens during `unwrap`
    // in the `assert_no_alloc!` macro
    assert_no_alloc!(async_capacity().poll().unwrap());
}
```

# Conclusion

While there's a lot more to writing high-performance code than managing your usage
of the allocator, it's critical that you do use the allocator correctly.
QADAPT is here to verify that your code is doing what you expect.

I'll be writing more about high-performance code in Rust in the future, and I expect
that QADAPT will help guide that. If there are topics you're interested in,
let me know in the comments below!

[qadapt]: https://crates.io/crates/qadapt