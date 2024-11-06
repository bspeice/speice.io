Title: Captain's Cookbook - Part 2
Date: 2018-01-18
Category: Blog
Tags: capnproto rust
Authors: Bradlee Speice
Summary: A look at more practical usages of Cap'N Proto
[//]: <> "Modified: "

# Captain's Cookbook - Part 2 - Using the TypedReader

[Part 1](http://bspeice.github.io/captains-cookbook-part-1.html) of this series took a look at a basic starting project
with Cap'N Proto. In this section, we're going to take the (admittedly basic) schema and look at how we can add a pretty
basic feature - sending Cap'N Proto messages between threads. It's nothing complex, but I want to make sure that there's
some documentation surrounding practical usage of the library.

As a quick refresher, we build a Cap'N Proto message and go through the serialization/deserialization steps
[here](https://github.com/bspeice/capnp_cookbook_1/blob/master/src/main.rs). Our current example is going to build on
the code we wrote there; after the deserialization step, we'll try and send the `point_reader` to a separate thread
for verification.

I'm going to walk through the attempts as I made them and my thinking throughout.
If you want to skip to the final project, check out the code available [here](https://github.com/bspeice/capnp_cookbook_2)

# Attempt 1: Move the reference

As a first attempt, we're going to try and let Rust move the reference. Our code will look something like:

<div class="highlight">

```rust
fn main() {

    // ...assume that we own a `buffer: Vec<u8>` containing the binary message content from
    // somewhere else

    let deserialized = capnp::serialize::read_message(
        &mut buffer.as_slice(),
        capnp::message::ReaderOptions::new()
    ).unwrap();

    let point_reader = deserialized.get_root::<point_capnp::point::Reader>().unwrap();

    // By using `point_reader` inside the new thread, we're hoping that Rust can
    // safely move the reference and invalidate the original thread's usage.
    // Since the original thread doesn't use `point_reader` again, this should
    // be safe, right?
    let handle = std::thread:spawn(move || {

        assert_eq!(point_reader.get_x(), 12);

        assert_eq!(point_reader.get_y(), 14);
    });

    handle.join().unwrap()
}
```

Well, the Rust compiler doesn't really like this. We get four distinct errors back:

```
error[E0277]: the trait bound `*const u8: std::marker::Send` is not satisfied in `[closure@src/main.rs:31:37: 36:6 point_reader:point_capnp::point::Reader<'_>]`                                                                                                                
  --> src/main.rs:31:18                                             
   |                                                                
31 |     let handle = std::thread::spawn(move || {                  
   |                  ^^^^^^^^^^^^^^^^^^ `*const u8` cannot be sent between threads safely                                              
   |                                                                

error[E0277]: the trait bound `*const capnp::private::layout::WirePointer: std::marker::Send` is not satisfied in `[closure@src/main.rs:31:37: 36:6 point_reader:point_capnp::point::Reader<'_>]`                                                                               
  --> src/main.rs:31:18                                             
   |                                                                
31 |     let handle = std::thread::spawn(move || {                  
   |                  ^^^^^^^^^^^^^^^^^^ `*const capnp::private::layout::WirePointer` cannot be sent between threads safely             
   |                                                                

error[E0277]: the trait bound `capnp::private::arena::ReaderArena: std::marker::Sync` is not satisfied                                  
  --> src/main.rs:31:18                                             
   |                                                                
31 |     let handle = std::thread::spawn(move || {                  
   |                  ^^^^^^^^^^^^^^^^^^ `capnp::private::arena::ReaderArena` cannot be shared between threads safely                   
   |                                                                

error[E0277]: the trait bound `*const std::vec::Vec<std::option::Option<std::boxed::Box<capnp::private::capability::ClientHook + 'static>>>: std::marker::Send` is not satisfied in `[closure@src/main.rs:31:37: 36:6 point_reader:point_capnp::point::Reader<'_>]`             
  --> src/main.rs:31:18                                             
   |                                                                
31 |     let handle = std::thread::spawn(move || {                  
   |                  ^^^^^^^^^^^^^^^^^^ `*const std::vec::Vec<std::option::Option<std::boxed::Box<capnp::private::capability::ClientHook + 'static>>>` cannot be sent between threads safely                                                                                   
   |                                                                

error: aborting due to 4 previous errors
```

Note, I've removed the help text for brevity, but suffice to say that these errors are intimidating.
Pay attention to the text that keeps on getting repeated though: `XYZ cannot be sent between threads safely`.

This is a bit frustrating: we own the `buffer` from which all the content was derived, and we don't have any
unsafe accesses in our code. We guarantee that we wait for the child thread to stop first, so there's no possibility
of the pointer becoming invalid because the original thread exits before the child thread does. So why is Rust
preventing us from doing something that really should be legal?

This is what is known as [fighting the borrow checker](https://doc.rust-lang.org/1.8.0/book/references-and-borrowing.html).
Let our crusade begin.

# Attempt 2: Put the `Reader` in a `Box

The [`Box`](https://doc.rust-lang.org/std/boxed/struct.Box.html) type allows us to convert a pointer we have
(in our case the `point_reader`) into an "owned" value, which should be easier to send across threads.
Our next attempt looks something like this:

```rust
fn main() {

    // ...assume that we own a `buffer: Vec<u8>` containing the binary message content
    // from somewhere else

    let deserialized = capnp::serialize::read_message(
        &mut buffer.as_slice(),
        capnp::message::ReaderOptions::new()
    ).unwrap();

    let point_reader = deserialized.get_root::<point_capnp::point::Reader>().unwrap();

    let boxed_reader = Box::new(point_reader);

    // Now that the reader is `Box`ed, we've proven ownership, and Rust can
    // move the ownership to the new thread, right?
    let handle = std::thread::spawn(move || {

        assert_eq!(boxed_reader.get_x(), 12);

        assert_eq!(boxed_reader.get_y(), 14);
    });

    handle.join().unwrap();
}
```

Spoiler alert: still doesn't work. Same errors still show up.

```
error[E0277]: the trait bound `*const u8: std::marker::Send` is not satisfied in `point_capnp::point::Reader<'_>`                       
  --> src/main.rs:33:18                                             
   |                                                                
33 |     let handle = std::thread::spawn(move || {                  
   |                  ^^^^^^^^^^^^^^^^^^ `*const u8` cannot be sent between threads safely                                              
   |                                                                

error[E0277]: the trait bound `*const capnp::private::layout::WirePointer: std::marker::Send` is not satisfied in `point_capnp::point::Reader<'_>`                                                                                                                              
  --> src/main.rs:33:18                                             
   |                                                                
33 |     let handle = std::thread::spawn(move || {                  
   |                  ^^^^^^^^^^^^^^^^^^ `*const capnp::private::layout::WirePointer` cannot be sent between threads safely             
   |                                                                

error[E0277]: the trait bound `capnp::private::arena::ReaderArena: std::marker::Sync` is not satisfied                                  
  --> src/main.rs:33:18                                             
   |                                                                
33 |     let handle = std::thread::spawn(move || {                  
   |                  ^^^^^^^^^^^^^^^^^^ `capnp::private::arena::ReaderArena` cannot be shared between threads safely                   
   |                                                                

error[E0277]: the trait bound `*const std::vec::Vec<std::option::Option<std::boxed::Box<capnp::private::capability::ClientHook + 'static>>>: std::marker::Send` is not satisfied in `point_capnp::point::Reader<'_>`                                                            
  --> src/main.rs:33:18                                             
   |                                                                
33 |     let handle = std::thread::spawn(move || {                  
   |                  ^^^^^^^^^^^^^^^^^^ `*const std::vec::Vec<std::option::Option<std::boxed::Box<capnp::private::capability::ClientHook + 'static>>>` cannot be sent between threads safely                                                                                   
   |                                                                

error: aborting due to 4 previous errors
```

Let's be a little bit smarter about the exceptions this time though. What is that
[`std::marker::Send`](https://doc.rust-lang.org/std/marker/trait.Send.html) thing the compiler keeps telling us about?

The documentation is pretty clear; `Send` is used to denote:

> Types that can be transferred across thread boundaries.

In our case, we are seeing the error messages for two reasons:

1.  Pointers (`*const u8`) are not safe to send across thread boundaries. While we're nice in our code
making sure that we wait on the child thread to finish before closing down, the Rust compiler can't make
that assumption, and so complains that we're not using this in a safe manner.

2.  The `point_capnp::point::Reader` type is itself not safe to send across threads because it doesn't
implement the `Send` trait. Which is to say, the things that make up a `Reader` are themselves not thread-safe,
so the `Reader` is also not thread-safe.

So, how are we to actually transfer a parsed Cap'N Proto message between threads?

# Attempt 3: The `TypedReader`

The `TypedReader` is a new API implemented in the Cap'N Proto [Rust code](https://crates.io/crates/capnp/0.8.14).
We're interested in it here for two reasons:

1.  It allows us to define an object where the _object_ owns the underlying data. In previous attempts,
the current context owned the data, but the `Reader` itself had no such control.

2.  We can compose the `TypedReader` using objects that are safe to `Send` across threads, guaranteeing
that we can transfer parsed messages across threads.

The actual type info for the [`TypedReader`](https://github.com/capnproto/capnproto-rust/blob/f0efc35d7e9bd8f97ca4fdeb7c57fd7ea348e303/src/message.rs#L181)
is a bit complex. And to be honest, I'm still really not sure what the whole point of the
[`PhantomData`](https://doc.rust-lang.org/std/marker/struct.PhantomData.html) thing is either.
My impression is that it lets us enforce type safety when we know what the underlying Cap'N Proto
message represents. That is, technically the only thing we're storing is the untyped binary message;
`PhantomData` just enforces the principle that the binary represents some specific object that has been parsed.

Either way, we can carefully construct something which is safe to move between threads:

```rust
fn main() {

    // ...assume that we own a `buffer: Vec<u8>` containing the binary message content from somewhere else

    let deserialized = capnp::serialize::read_message(
        &mut buffer.as_slice(),
        capnp::message::ReaderOptions::new()
    ).unwrap();

    let point_reader: capnp::message::TypedReader<capnp::serialize::OwnedSegments, point_capnp::point::Owned> =
        capnp::message::TypedReader::new(deserialized);

    // Because the point_reader is now working with OwnedSegments (which are owned vectors) and an Owned message
    // (which is 'static lifetime), this is now safe
    let handle = std::thread::spawn(move || {

        // The point_reader owns its data, and we use .get() to retrieve the actual point_capnp::point::Reader
        // object from it
        let point_root = point_reader.get().unwrap();

        assert_eq!(point_root.get_x(), 12);

        assert_eq!(point_root.get_y(), 14);
    });

    handle.join().unwrap();
}
```

And while we've left Rust to do the dirty work of actually moving the `point_reader` into the new thread,
we could also use things like [`mpsc` channels](https://doc.rust-lang.org/std/sync/mpsc/index.html) to achieve a similar effect.

So now we're able to define basic Cap'N Proto messages, and send them all around our programs.

## Next steps:

[Part 1: Setting up a basic Cap'N Proto Rust project](http://bspeice.github.io/captains-cookbook-part-1.html)

Part 3: Serialization and Deserialization of multiple Cap'N Proto messages
