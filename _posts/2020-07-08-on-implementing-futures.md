---
layout: post
title: "Tips for Implementing `Future`"
description: ""
category:
tags: [python]
---

When support for async/await launched in Rust, it came with a couple of technical caveats; it was
deemed more beneficial to release a minimum viable product than wait for a feature-complete release.
So far, this model seems to have worked out well. Asynchronous code originally required thread-local
storage for context tracking which mean that it could only be used in projects that included the
Rust standard library. It wasn't a hard requirement; nothing about the async design mandated context
tracking in this way. But given that most users of asynchronous code relied on the standard library
anyway, supporting asynchronous `no_std` projects was left as something to be addressed later. After
some fantastic work, thread-local storage is no longer used and there's some incredibly cool work
being done to enable Rust on `no_std` and embedded systems. While asynchronous programming is very
frequently used to model disk or network I/O, the same principles can be applied to monitoring
signals received from GPIO pins.

NOTE: Should I mention something about how cool it is that we can have `async` without needing heap
allocations or type erasure like in every other `async` implementation?

One other missing feature in the initial async support was being able to write traits that contained
`async fn` methods Normally, when an `async fn` function is declared, the compiler does some magic
to the function signature:

```rust
struct R;

// When you write a function like this:
async fn read_bytes(s: TcpStream) -> R { /* ... */ }

// ...the compiler effectively transforms it into this:
fn read_bytes(s: TcpStream) -> impl Future<Output = R> { /* ... */ }
```

This special return type (the `impl Future` thing) tells the compiler "I have no idea what the
_exact_ return type will be, but it will be something that implements `Future`, just figure it out
for me." If you're writing static or `struct` functions, that's no issue, the compiler can figure
everything out for you.

However, this "figure it out for me" mentality doesn't work when used with traits. The reasons are
varied and complex and out of scope for this discussion. But if we want to mix traits and
asynchronous code, we simply need to make sure the trait method returns a type that implements the
`Future` trait:

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

pub struct Byte(u8);

// Implementing this section of the code is what we'll be talking about.
// vvvvvvvvvvvvvvvvvvv
impl Future for Byte {
    type Output = u8;

    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {
        return Poll::Ready(self.0);
    }
}
// ^^^^^^^^^^^^^^^^^^^

pub trait ByteReader {
    fn get_byte(&self) -> Byte;
}

pub async fn my_function(b: impl ByteReader) -> u8 {
    b.get_byte().await
}
```

Because of some Rust-specific issues (the `Pin`/`Unpin` system, unhelpful compiler messages),
implementing `Future` directly can be rather difficult. It's possible to use crates like
`async_trait` to work around the limitation, but if you're interested in building your own futures,
these techniques should make the process at least a bit easier.

# Implement functionality before structure

Don't `impl Future` right away; use a separate method and pass eevrything in. It's helpful to
de-couple "what you need in order to function" from "how you get those things"; are you supposed to
use `#[pin_project]` or `let Self { } = &mut *self` or maybe just `&mut self.value`? Self-pinning
makes things weird, and it's typically safe to deal with those questions later. Two guidelines:

1. Everything that needs to be `poll`-ed should be passed as `Pin<&mut T>`
2. Everything else passed by reference.

Don't call this function before it's ready; errors elsewhere in the code can make it difficult to
understand if the problem is in your "inner" function implementation, or the `impl Future`
implementation.

# Dealing with unfulfilled trait bounds

Should also add something about how `AsyncBufRead` isn't implemented for `&R3`, but _is_ after deref
(`R3`). The errors become a lot more obvious if you try to deref `self.reader`:

```rust
use futures_io::AsyncBufRead;
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

fn poll_once<R1: AsyncBufRead + ?Sized>(mut reader: Pin<&mut R1>, cx: &mut Context<'_>) -> Poll<()> {
    reader.as_mut().poll_fill_buf(cx);
    return Poll::Ready(());
}

struct MyStruct<'a, R2: ?Sized> {
    reader: &'a R2,
}

impl<R3: AsyncBufRead + ?Sized + Unpin> Future for MyStruct<'_, R3> {
    type Output = ();

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        // Important bit is the `*self.reader` here
        poll_once(Pin::new(&mut *self.reader), cx)
    }
}
```

```text
error[E0596]: cannot borrow data in a dereference of `std::pin::Pin<&mut MyStruct<'_, R3>>` as mutable
  --> src/lib.rs:19:28
   |
12 |     reader: &'a R2,
   |             ------ help: consider changing this to be mutable: `&'a mut R2`
...
19 |         poll_once(Pin::new(&mut *self.reader), cx)
   |                            ^^^^^^^^^^^^^^^^^ cannot borrow as mutable

error[E0596]: cannot borrow `self` as mutable, as it is not declared as mutable
  --> src/lib.rs:19:34
   |
18 |     fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
   |             ---- help: consider changing this to be mutable: `mut self`
19 |         poll_once(Pin::new(&mut *self.reader), cx)
   |                                  ^^^^ cannot borrow as mutable
```

Now, we can see that `self` can't be borrowed as mutable (it needs to be marked
`mut self: Pin<&mut Self>`) and that the reader can't be borrowed as mutable (the struct definition
needs `&'a mut R2`). After those are fixed, we're good to go.

# Don't feel bad about requiring `Unpin`

For trait bounds, don't require it unless you need to, but don't hesitate to add it if the compiler
thinks you should.

```rust
use futures_io::AsyncBufRead;
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

fn poll_once<R1: AsyncBufRead + ?Sized>(mut reader: Pin<&mut R1>, cx: &mut Context<'_>) -> Poll<()> {
    reader.as_mut().poll_fill_buf(cx);
    return Poll::Ready(());
}

struct MyStruct<'a, R2: ?Sized> {
    reader: &'a R2,
}

impl<R3: AsyncBufRead + ?Sized> Future for MyStruct<'_, R3> {
    type Output = ();

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        poll_once(Pin::new(&mut self.reader), cx)
    }
}
```

The type bounds for `R1` and `R3` seem to be identical, but are actually slightly different:

```text
error[E0277]: `R3` cannot be unpinned
  --> src/lib.rs:19:9
   |
6  | fn poll_once<R1: AsyncBufRead + ?Sized>(mut reader: Pin<&mut R1>, cx: &mut Context<'_>) -> Poll<()> {
   |                  ------------ required by this bound in `poll_once`
...
19 |         poll_once(Pin::new(&mut self.reader), cx)
   |         ^^^^^^^^^ the trait `std::marker::Unpin` is not implemented for `R3`
   |
   = note: required because of the requirements on the impl of `futures_io::if_std::AsyncBufRead` for `&mut R3`
help: consider further restricting this bound
   |
15 | impl<R3: AsyncBufRead + ?Sized + std::marker::Unpin> Future for MyStruct<'_, R3> {
   |                                ^^^^^^^^^^^^^^^^^^^^
```

For struct, if they have no `Pin` elements, `Unpin` is automatically implemented. Just need to make
sure that type bounds contain `Unpin`, or weird things happen when trying to use them:

```rust
#![allow(unused_mut)]
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

struct CantUnpin<T> {
    items: Vec<T>
}

impl<T: Default> Future for CantUnpin<T> {
    type Output = ();

    fn poll(mut self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {
        self.items.push(T::default());
        Poll::Ready(())
    }
}

struct CanUnpin<T> {
    items: Vec<T>
}

impl<T: Default + Unpin> Future for CanUnpin<T> {
    type Output = ();

    fn poll(mut self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {
        self.items.push(T::default());
        Poll::Ready(())
    }
}
```

```text
error[E0596]: cannot borrow data in a dereference of `std::pin::Pin<&mut CantUnpin<T>>` as mutable
  --> src/lib.rs:14:9
   |
14 |         self.items.push(T::default());
   |         ^^^^^^^^^^ cannot borrow as mutable
   |
   = help: trait `DerefMut` is required to modify through a dereference, but it is not implemented for `std::pin::Pin<&mut CantUnpin<T>>`
```

Rule of thumb: If you don't know whether it implements `Unpin`, it almost certainly does.

# Know what the escape hatches are

When used sparingly, either `#[async_trait]` or `BoxFuture` can enable async functionality in code
that will later not need the allocations. Use the escape hatch when you need to such that you can
continue making incremental improvements later.

Specific trick: use `BoxFuture` for type erasure:

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};
use futures::future::BoxFuture;

async fn function1() {}

async fn function2() -> u8 { 0 }

pub struct MyStruct<T> {
    f: BoxFuture<'static, T>
}

impl<T> Future for MyStruct<T> {
    type Output = T;

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<T> {
        self.f.as_mut().poll(cx)
    }
}

pub fn another_function() -> MyStruct<u8> {
    MyStruct { f: Box::pin(async {
        function1().await;
        function2().await
    }) }
}
```

There's one allocation because of `Box::pin()`, but that's it. We're allowed to use an opaque
`impl Future` and still return values from it.
