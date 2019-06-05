---
layout: post
title: "Representing Hierarchies - The Reference Stack Pattern"
description: ""
category: 
tags: [rust]
---

Of late, I've been working to add support for Rust to the [Kaitai Struct](https://kaitai.io/) project. The idea is to describe data formats
using a YAML schema, and then generate all the code needed for parsing them. Kind of like if you replaced packages like `nom` with a YAML
document instead of macros in code.

While the project specifics aren't incredibly important, it did force me to take a look at how hierarchies are represented
in Rust, something that [many people](https://hackernoon.com/why-im-dropping-rust-fd1c32986c88#37ee) struggle with. The basic
problem formulation is simple:

- A root/parent object owns some number of child objects
- Each child needs access to all its parents to do some work

The specifics are what make this a bit complicated:

- Each node in this tree can be of a different (though sometimes predictable) type
- If possible, we'd like to avoid `Rc` (performance, `no_std`, pick a reason)

This hierarchical or "DOM-like" structure shows up in two places that I'm familiar with, but is generic enough to be used in a broad range
of applications. The first example is parser generators (like Kaitai); as an example, describing the [Websocket](https://datatracker.ietf.org/doc/rfc6455/)
[format](https://github.com/kaitai-io/kaitai_struct_formats/blob/861b2fd048252a8092b8d04c2e9f91d0be3671a9/network/websocket.ksy)
requires that every dataframe after the initial know the message type of the first (be it text or binary). The second example is in GUIs,
where you typically describe an application as a collection of widgets.

We'll develop a toy DOM-like example as motivation, and look at how it can be extended to accommodate more specific situations as necessary.


