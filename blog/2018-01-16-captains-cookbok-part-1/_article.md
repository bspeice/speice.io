Title: Captain's Cookbook - Part 1
Date: 2018-01-16
Category: Blog
Tags: capnproto rust
Authors: Bradlee Speice
Summary: A basic introduction to getting started with Cap'N Proto
[//]: <> "Modified: "

# Captain's Cookbook - Part 1

I've been working a lot with [Cap'N Proto](https://capnproto.org/) recently with Rust, but there's a real dearth of information
on how to set up and get going quickly. In the interest of trying to get more people using this (because I think it's
fantastic), I'm going to work through a couple of examples detailing what exactly should be done to get going.

So, what is Cap'N Proto? It's a data serialization library. It has contemporaries with [Protobuf](https://developers.google.com/protocol-buffers/)
and [FlatBuffers](https://google.github.io/flatbuffers/), but is better compared with FlatBuffers. The whole point behind it
is to define a schema language and serialization format such that:

1. Applications that do not share the same base programming language can communicate
2. The data and schema you use can naturally evolve over time as your needs change

Accompanying this are typically code generators that take the schemas you define for your application and give you back
code for different languages to get data to and from that schema.

Now, what makes Cap'N Proto different from, say, Protobuf, is that there is no serialization/deserialization step the same way
as is implemented with Protobuf. Instead, the idea is that the message itself can be loaded in memory and used directly there.

We're going to take a look at a series of progressively more complex projects that use Cap'N Proto in an effort to provide some
examples of what idiomatic usage looks like, and shorten the startup time needed to make use of this library in Rust projects.
If you want to follow along, feel free. If not, I've posted [the final result](https://github.com/bspeice/capnp_cookbook_1)
for reference.

# Step 1: Installing `capnp`

The `capnp` binary itself is needed for taking the schema files you write and turning them into a format that can be used by the
code generation libraries. Don't ask me what that actually means, I just know that you need to make sure this is installed.

I'll refer you to [Cap'N Proto's installation instructions](https://capnproto.org/install.html) here. As a quick TLDR though:

- Linux users will likely have a binary shipped by their package manager - On Ubuntu, `apt install capnproto` is enough
- OS X users can use [Homebrew](https://brew.sh/) as an easy install path. Just `brew install capnp`
- Windows users are a bit more complicated. If you're using [Chocolatey](https://chocolatey.org/), there's [a package](https://chocolatey.org/packages/capnproto/) available. If that doesn't work however, you need to download [a release zip](https://capnproto.org/capnproto-c++-win32-0.6.1.zip) and make sure that the `capnp.exe` binary is in your `%PATH%` environment variable

The way you know you're done with this step is if the following command works in your shell:

```bash
capnp id
```

# Step 2: Starting a Cap'N Proto Rust project

After the `capnp` binary is set up, it's time to actually create our Rust project. Nothing terribly complex here, just a simple

```bash
mkdir capnp_cookbook_1
cd capnp_cookbook_1
cargo init --bin
```

We'll put the following content into `Cargo.toml`:

```
[package]
name = "capnp_cookbook_1"
version = "0.1.0"
authors = ["Bradlee Speice <bspeice@kcg.com>"]

[build-dependencies]
capnpc = "0.8"  # 1

[dependencies]
capnp = "0.8"  # 2
```

This sets up: 

1. The Rust code generator (CAPNProto Compiler)
2. The Cap'N Proto runtime library (CAPNProto runtime)

We've now got everything prepared that we need for writing a Cap'N Proto project.

# Step 3: Writing a basic schema

We're going to start with writing a pretty trivial data schema that we can extend later. This is just intended to make sure
you get familiar with how to start from a basic project.

First, we're going to create a top-level directory for storing the schema files in:

```bash
# Assuming we're starting from the `capnp_cookbook_1` directory created earlier

mkdir schema
cd schema
```

Now, we're going to put the following content in `point.capnp`:

```
@0xab555145c708dad2;

struct Point {
    x @0 :Int32;
    y @1 :Int32;
}
```

Pretty easy, we've now got structure for an object we'll be able to quickly encode in a binary format.

# Step 4: Setting up the build process

Now it's time to actually set up the build process to make sure that Cap'N Proto generates the Rust code we'll eventually be using.
This is typically done through a `build.rs` file to invoke the schema compiler.

In the same folder as your `Cargo.toml` file, please put the following content in `build.rs`:

```rust
extern crate capnpc;

fn main() {
    ::capnpc::CompilerCommand::new()
        .src_prefix("schema")  // 1
        .file("schema/point.capnp")  // 2
        .run().expect("compiling schema");
}
```

This sets up the protocol compiler (`capnpc` from earlier) to compile the schema we've built so far.

1. Because Cap'N Proto schema files can re-use types specified in other files, the `src_prefix()` tells the compiler
where to look for those extra files at.
2. We specify the schema file we're including by hand. In a much larger project, you could presumably build the `CompilerCommand`
dynamically, but we won't worry too much about that one for now.

# Step 5: Running the build

If you've done everything correctly so far, you should be able to actually build the project and see the auto-generated code.
Run a `cargo build` command, and if you don't see `cargo` complaining, you're doing just fine!

So where exactly does the generated code go to? I think it's critically important for people to be able to see what the generated
code looks like, because you need to understand what you're actually programming against. The short answer is: the generated code lives
somewhere in the `target/` directory.

The long answer is that you're best off running a `find` command to get the actual file path:

```bash
# Assuming we're running from the capnp_cookbook_1 project folder
find . -name point_capnp.rs
```

Alternately, if the `find` command isn't available, the path will look something like:

```
./target/debug/build/capnp_cookbook_1-c6e2990393c32fe6/out/point_capnp.rs
```

See if there are any paths in your target directory that look similar.

Now, the file content looks pretty nasty. I've included an example [here](https://github.com/bspeice/capnp_cookbook_1/blob/master/target/debug/build/capnp_cookbook_1-c6e2990393c32fe6/out/point_capnp.rs)
if you aren't following along at home. There are a couple things I'll try and point out though so you can get an idea of how
the schema we wrote for the "Point" message is tied to the generated code.

First, the Cap'N Proto library splits things up into `Builder` and `Reader` structs. These are best thought of the same way
Rust separates `mut` from non-`mut` code. `Builder`s are `mut` versions of your message, and `Reader`s are immutable versions.

For example, the [`Builder` impl](https://github.com/bspeice/capnp_cookbook_1/blob/master/target/debug/build/capnp_cookbook_1-c6e2990393c32fe6/out/point_capnp.rs#L90) for `point` defines [`get_x()`](https://github.com/bspeice/capnp_cookbook_1/blob/master/target/debug/build/capnp_cookbook_1-c6e2990393c32fe6/out/point_capnp.rs#L105), [`set_x()`](https://github.com/bspeice/capnp_cookbook_1/blob/master/target/debug/build/capnp_cookbook_1-c6e2990393c32fe6/out/point_capnp.rs#L109), [`get_y()`](https://github.com/bspeice/capnp_cookbook_1/blob/master/target/debug/build/capnp_cookbook_1-c6e2990393c32fe6/out/point_capnp.rs#L113), and [`set_y()`](https://github.com/bspeice/capnp_cookbook_1/blob/master/target/debug/build/capnp_cookbook_1-c6e2990393c32fe6/out/point_capnp.rs#L117) methods.
In comparison, the [`Reader` impl](https://github.com/bspeice/capnp_cookbook_1/blob/master/target/debug/build/capnp_cookbook_1-c6e2990393c32fe6/out/point_capnp.rs#L38) only defines [`get_x()`](https://github.com/bspeice/capnp_cookbook_1/blob/master/target/debug/build/capnp_cookbook_1-c6e2990393c32fe6/out/point_capnp.rs#L47) and [`get_y()`](https://github.com/bspeice/capnp_cookbook_1/blob/master/target/debug/build/capnp_cookbook_1-c6e2990393c32fe6/out/point_capnp.rs#L51) methods.

So now we know that there are some `get` and `set` methods available for our `x` and `y` coordinates;
but what do we actually do with those?

# Step 6: Making a point

So we've install Cap'N Proto, gotten a project set up, and can generate schema code now. It's time to actually start building
Cap'N Proto messages! I'm going to put the code you need here because it's small, and put some extra long comments inline. This code
should go in [`src/main.rs`](https://github.com/bspeice/capnp_cookbook_1/blob/master/src/main.rs):

```rust
// Note that we use `capnp` here, NOT `capnpc`
extern crate capnp;

// We create a module here to define how we are to access the code
// being included.
pub mod point_capnp {
    // The environment variable OUT_DIR is set by Cargo, and
    // is the location of all the code that was built as part
    // of the codegen step.
    // point_capnp.rs is the actual file to include
    include!(concat!(env!("OUT_DIR"), "/point_capnp.rs"));
}

fn main() {

    // The process of building a Cap'N Proto message is a bit tedious.
    // We start by creating a generic Builder; it acts as the message
    // container that we'll later be filling with content of our `Point`
    let mut builder = capnp::message::Builder::new_default();

    // Because we need a mutable reference to the `builder` later,
    // we fence off this part of the code to allow sequential mutable
    // borrows. As I understand it, non-lexical lifetimes:
    // https://github.com/rust-lang/rust-roadmap/issues/16
    // will make this no longer necessary
    {
        // And now we can set up the actual message we're trying to create
        let mut point_msg = builder.init_root::<point_capnp::point::Builder>();

        // Stuff our message with some content
        point_msg.set_x(12);

        point_msg.set_y(14);
    }

    // It's now time to serialize our message to binary. Let's set up a buffer for that:
    let mut buffer = Vec::new();

    // And actually fill that buffer with our data
    capnp::serialize::write_message(&mut buffer, &builder).unwrap();

    // Finally, let's deserialize the data
    let deserialized = capnp::serialize::read_message(
        &mut buffer.as_slice(),
        capnp::message::ReaderOptions::new()
    ).unwrap();

    // `deserialized` is currently a generic reader; it understands
    // the content of the message we gave it (i.e. that there are two
    // int32 values) but doesn't really know what they represent (the Point).
    // This is where we map the generic data back into our schema.
    let point_reader = deserialized.get_root::<point_capnp::point::Reader>().unwrap();

    // We can now get our x and y values back, and make sure they match
    assert_eq!(point_reader.get_x(), 12);
    assert_eq!(point_reader.get_y(), 14);
}
```

And with that, we've now got a functioning project. Here's the content I'm planning to go over next as we build up
some practical examples of Cap'N Proto in action:

## Next steps:

Part 2: Using [TypedReader](https://github.com/capnproto/capnproto-rust/blob/master/src/message.rs#L181) to send messages across thread boundaries

Part 3: Serialization and Deserialization of multiple Cap'N Proto messages
