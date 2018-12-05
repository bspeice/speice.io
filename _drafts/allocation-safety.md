---
layout: post
title: "QADAPT - Allocation Safety in Rust"
description: "...and why you want an allocator that blows up."
category: 
tags: []
---

I think it's part of the human condition to ignore perfectly good advice that comes our way.
Just a month ago, I too was dispensing sage wisdom for the ages:

> I had a really great idea: build a custom allocator that allows you to track
> your own allocations. That way, you can do things like writing tests for both
> correct results and correct memory usage. I gave it a shot, but learned very quickly:
> **never write your own allocator.**
>
> -- [me](/2018/10/case-study-optimization.html)

I then proceeded to ignore it, because we never really learn from our mistakes.

There's another part of the human condition that derives a strange sort of joy from
seeing things explode.

<iframe src="https://giphy.com/embed/YA6dmVW0gfIw8" width="480" height="336" frameBorder="0"></iframe>

And *that's* the part of the human condition I'm going to focus on.

# Why a new Allocator

So why after complaining about allocators would I want to go back and write one myself?
There's two reasons for that:

1. **Allocation/dropping is slow**
2. **It's difficult to know when exactly Rust will allocate/drop**

When I say "slow," it's important to define the terms. If you're writing web applications,
you'll spend orders of magnitude more time waiting for the database than you will the allocator.
However, there's still plenty of code where micro- or nano-seconds matter; think finance,
[real-time audio](https://www.reddit.com/r/rust/comments/9hg7yj/synthesizer_progress_update/e6c291f),
[self-driving cars](https://polysync.io/blog/session-types-for-hearty-codecs/), and networking.
In these situations it's simply unacceptable for you to be spending time doing things
that are not your program, and interacting with the allocator feels like it takes forever.

Secondly, it's a bit difficult to predict where exactly allocations will happen in Rust code. We're going
to play a quick trivia game: **Does this code trigger an allocation?**

## Example 1

```rust
fn main() {
    let v: Vec<u8> = Vec::new();
}
```

**No**: Rust knows that we can reserve memory on the stack for the `v` vector, and the allocator will
never be asked to reserve memory in the heap.

## Example 2

```rust
fn main() {
    let v: Box<Vec<u8>> = Box::new(Vec::new());
}
```

**Yes**: Even though we know ahead of time the total amount of memory needed, `Box` forces a heap allocation.

## Example 3

```rust
fn main() {
    let v: Vec<u8> = Vec::new();
    v.push(0);
}
```

**Maybe**: `Vec::new()` creates an empty vector and thus will be forced to allocate space when we give it a value.
However, in `release` builds, Rust is able to optimize out the allocation that normally happens in `push()`
and avoid interacting with the allocator.

That last example should be a bit surprising - Rust may change its allocation behavior depending on the
optimization level. It's thus important to trust that Rust will optimize code well, but also verify
that you are getting the behavior you intend.

# Blowing Things Up

So, how exactly does QADAPT solve these problems? **Whenever an allocation occurs in code marked
allocation-safe, QADAPT triggers a thread panic.** We don't want to let the program continue as if
nothing strange happened, *we want things to explode*.

QADAPT will handle the destructive part of things, you're responsible for marking the code as
containing no allocations. To do so, there are two ways:

## Using function calls

```rust
use qadapt::enter_protected;
use qadapt::exit_protected;

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

## Using a procedural macro

```rust
use qadapt::allocate_panic;

#[allocate_panic]
fn push_vec(v: &mut Vec<u8>) {
    // This triggers a panic if v.len() == v.capacity()
    v.push(0);
}

fn main() {
    let v = Vec::with_capacity(1);

    // This won't trigger a panic
    push_vec(&v);

    // This will trigger a panic
    push_vec(&v);
}
```

## Caveats

It's important to point out that QADAPT code is synchronous, and you may get
strange behavior unless you're careful:

```rust
// Futures example here
```

# Looking Forward

Writing blog post about when/where Rust allocates based on practical usage

1. Is this something useful for you?
2. Different behavior? Just log backtraces instead of panic?
3. "Allocation explorer" online like compiler explorer?

[qadapt]: https://crates.io/crates/qadapt