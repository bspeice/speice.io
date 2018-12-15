---
layout: post
title: "QADAPT - debug_assert! for your memory usage"
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

And *that's* the part I'm going to focus on.

# Why an Allocator?

So why, after complaining about allocators, would I still want to write one?
There are three reasons for that:

1. Allocation/dropping is slow
2. It's difficult to know exactly when Rust will allocate or drop, especially when using
code that you did not write
3. I want automated tools to verify behavior, instead of inspecting by hand

When I say "slow," it's important to define the terms. If you're writing web applications,
you'll spend orders of magnitude more time waiting for the database than you will the allocator.
However, there's still plenty of code where micro- or nano-seconds matter; think
[finance](https://www.youtube.com/watch?v=NH1Tta7purM),
[real-time audio](https://www.reddit.com/r/rust/comments/9hg7yj/synthesizer_progress_update/e6c291f),
[self-driving cars](https://polysync.io/blog/session-types-for-hearty-codecs/), and 
[networking](https://carllerche.github.io/bytes/bytes/index.html).
In these situations it's simply unacceptable for you to spend time doing things
that are not your program, and waiting on the allocator is not cool.

As I continue to learn Rust, it's difficult for me to predict where exactly allocations will happen.
So, I propose we play a quick trivia game: **Does this code invoke the allocator?**

## Example 1

```rust
fn my_function() {
    let v: Vec<u8> = Vec::new();
}
```

**No**: Rust [knows how big](https://doc.rust-lang.org/std/mem/fn.size_of.html)
the `Vec` type is, and reserves a fixed amount of memory on the stack for the `v` vector.
However, if we wanted to reserve extra space (using `Vec::with_capacity`) the allocator
would get invoked.

## Example 2

```rust
fn my_function() {
    let v: Box<Vec<u8>> = Box::new(Vec::new());
}
```

**Yes**: Because Boxes allow us to work with things that are of unknown size, it has to allocate
on the heap. While the `Box` is unnecessary in this snippet (release builds will optimize out
the allocation), reserving heap space more generally is needed to pass a dynamically sized type
to another function.

## Example 3

```rust
fn my_function(v: Vec<u8>) {
    v.push(5);
}
```

**Maybe**: Depending on whether the Vector we were given has space available, we may or may not allocate.
Especially when dealing with code that you did not author, it's difficult to verify that things behave
as you expect them to.

# Blowing Things Up

So, how exactly does QADAPT solve these problems? **Whenever an allocation or drop occurs in code marked
allocation-safe, QADAPT triggers a thread panic.** We don't want to let the program continue as if
nothing strange happened, *we want things to explode*.

However, you don't want code to panic in production because of circumstances you didn't predict.
Just like [`debug_assert!`](https://doc.rust-lang.org/std/macro.debug_assert.html),
**QADAPT will strip out its own code when building in release mode to guarantee no panics and
no performance impact.**

Finally, there are three ways to have QADAPT check that your code will not invoke the allocator:

## Using a procedural macro

The easiest method, watch an entire function for allocator invocation:

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
    // because it's a scalar. If it were a `Box<_>` type,
    // a drop would trigger.
    assert_no_alloc!({
        v.pop().unwrap();
    });
}
```

## Using function calls

Both the most precise and most tedious:

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
QADAPT will verify that your code is doing what you expect. It's usable even on
stable Rust from version 1.31 onward, which isn't the case for most allocators.

I'm hoping to write more about high-performance Rust in the future, and I expect
that QADAPT will help guide that. If there are topics you're interested in,
let me know in the comments below!

[qadapt]: https://crates.io/crates/qadapt