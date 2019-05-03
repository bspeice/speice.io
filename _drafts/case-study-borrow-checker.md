---
layout: post
title: "A Case Study in Borrow Checking"
description: "...and some practical lessons learned."
category: 
tags: [rust]
---

I'm convinced that WebSockets are a gateway drug. The specification is reasonably easy to understand, and implementations are an opportunity to both dig into the lower-level details of networking code and experiment with new techniques. It's essentially [writing](https://www.youtube.com/watch?v=HyzD8pNlpwI) [a](https://cturt.github.io/cinoop.html) [Gameboy](https://blog.rekawek.eu/2017/02/09/coffee-gb/) [emulator](https://djhworld.github.io/post/2018/09/21/i-ported-my-gameboy-color-emulator-to-webassembly/), but for network code instead of emulation. 

At least, that's how I'm approaching it. While there are [existing](https://github.com/housleyjk/ws-rs) [implementations](https://github.com/websockets-rs/rust-websocket) of the protocol for Rust, writing a WebSocket library is an opportunity for me to experiment with parser [combinators](https://github.com/Geal/nom) and [generators](https://github.com/kaitai-io/kaitai_struct), and maybe have something to show at the end of it. Recently, I've been adding support for Rust to the [Kaitai Struct](http://kaitai.io/) project so that I can generate the parser from a schema, rather than writing one by hand. But before we can generate a parser using Kaitai, we need a runtime library. This is a typical pattern in code generation; the generated code relies on a "standard library" of functionality similar to how programming languages have their own standard library.

What makes this parser runtime difficult to implement in Rust is the performance concerns; we don't want to allocate new `Vec<u8>` buffers and copy data around when it's not necessary. Especially in networking code, these types of "zero-copy" operations are critical to performance. And because we're not interested in modifying the data stream, references make a lot of sense! However, that means there's a good potential to hit issues with the borrow checker; making sure all the structures being parsed use the stream correctly is difficult. As a result, I hit a lot of issues with the borrow checker, and wanted to detail what I learned about not only how to *avoid* fighting the borrow checker, but how to *work with* the borrow checker.

# Design Inspiration - C++

So how exactly does one go about building such a runtime? In this case, we'll start by looking at Kaitai's [C++ support](https://github.com/kaitai-io/kaitai_struct_cpp_stl_runtime) for inspiration, and see if we can adapt that to Rust. There's even an [ownership guide](http://doc.kaitai.io/lang_cpp_stl.html#_ownership_model) detailing the rules for how the C++ runtime thinks about ownership!

This article will use a toy schema for illustrating lifetimes:

```yaml
meta:
  id: toy
  title: Toy Schema
  endian: be

seq:
  - id: slice_size
    type: u1
  - id: child_structure
    type: child

types:
  child:
    seq:
      - id: slice
        size: _parent.slice_size
      - id: grandchild_structure
        type: grandchild

  grandchild:
    seq:
      - id: slice
        size: _root.slice_size
```

The parser will operate like this:

1. Read a single byte (`u8` in Rust) from a stream, and store that in `slice_size`
2. Read a child structure. First, read a byte slice whose size is the parent structure's `slice_size`, then read the grandchild
3. Read a granchild structure by taking a byte slice whose size is the root structure's `slice_size`

So let's start by generating the C++ code corresponding to our specification (edited for clarity):

**toy.h**
```cpp
class toy_t : public kaitai::kstruct {

public:
    class child_t;
    class grandchild_t;

    toy_t(kaitai::kstream* p__io, kaitai::kstruct* p__parent = nullptr, toy_t* p__root = nullptr);
    ~toy_t();

    class child_t : public kaitai::kstruct {
    public:
        child_t(kaitai::kstream* p__io, toy_t* p__parent = nullptr, toy_t* p__root = nullptr);
        ~child_t();

    private:
        std::string m_slice;
        std::unique_ptr<grandchild_t> m_grandchild_structure;
        toy_t* m__root;
        toy_t* m__parent;
    };

    class grandchild_t : public kaitai::kstruct {
    public:
        grandchild_t(kaitai::kstream* p__io, toy_t::child_t* p__parent = nullptr, toy_t* p__root = nullptr);
        ~grandchild_t();

    private:
        std::string m_slice;
        toy_t* m__root;
        toy_t::child_t* m__parent;
    };

private:
    uint8_t m_initial_byte;
    std::unique_ptr<child_t> m_child_structure;
    toy_t* m__root;
    kaitai::kstruct* m__parent;
};
```

**toy.cpp**
```cpp
#include "toy.h"

toy_t::toy_t(kaitai::kstream* p__io, kaitai::kstruct* p__parent, toy_t* p__root) : kaitai::kstruct(p__io) {
    m__parent = p__parent;
    m__root = this;
    m_child_structure = nullptr;
    _read();
}

void toy_t::_read() {
    m_slice_size = m__io->read_u1();
    m_child_structure = std::unique_ptr<child_t>(new child_t(m__io, this, m__root));
}

toy_t::child_t::child_t(kaitai::kstream* p__io, toy_t* p__parent, toy_t* p__root) : kaitai::kstruct(p__io) {
    m__parent = p__parent;
    m__root = p__root;
    m_grandchild_structure = nullptr;
    _read();
}

void toy_t::child_t::_read() {
    m_slice = m__io->read_bytes(_parent()->slice_size());
    m_grandchild_structure = std::unique_ptr<grandchild_t>(new grandchild_t(m__io, this, m__root));
}

toy_t::grandchild_t::grandchild_t(kaitai::kstream* p__io, toy_t::child_t* p__parent, toy_t* p__root) : kaitai::kstruct(p__io) {
    m__parent = p__parent;
    m__root = p__root;
    _read();
}

void toy_t::grandchild_t::_read() {
    m_slice = m__io->read_bytes(_root()->slice_size());
}
```

Now, let's think about ownership as we look at the code:
- Each parent structure (`toy_t` and `child_t`) expresses ownership of its children through `std::unique_ptr<>`.
- Because children can refer to parents through `m__parent` and `m__root`, we have a reference cycle that will be difficult to express in Rust.
- Everyone stores a reference to `kaitai::kstream`, but nobody owns it.
- Structures own their data using `std::string` ([`read_bytes` implementation](https://github.com/kaitai-io/kaitai_struct_cpp_stl_runtime/blob/1ea056ad053b438e1609fe84e71b1d306777492d/kaitai/kaitaistream.cpp#L347-L361));
  this prevents issues if the stream (`m__io`) gets destroyed, but also introduces an extra allocation and copy that Rust can avoid if we convince the borrow checker that structures won't outlive the stream.
- The root structure (`toy_t`) stores a reference to itself; it's thus unsafe to copy or move.

With all that in mind, let's talk about ownership in the Rust runtime.

