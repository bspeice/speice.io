---
layout: post
title: "Summary: What Are the Rules?"
description: "A synopsis and reference."
category: 
tags: [rust, understanding-allocations]
---

While there's a lot of interesting detail captured in this series, it's often helpful
to have a document that answers some "yes/no" questions. You may not care about
what an `Iterator` looks like in assembly, you just need to know whether it allocates
an object on the heap or not.

To that end, it should be said once again: if you care about memory behavior,
use an allocator to verify the correct behavior. Tools like
[`alloc_counter`](https://crates.io/crates/alloc_counter) are designed to make
testing this behavior simple easy.

Finally, a summary of the content that's been covered. Rust will prioritize
the fastest behavior it can, but here are the ground rules for understanding
the memory model in Rust:

**Heap Allocation**:
- Smart pointers (`Box`, `Rc`, `Mutex`, etc.) allocate their contents in heap memory.
- Collections (`HashMap`, `Vec`, `String`, etc.) allocate their contents in heap memory.
- Some smart pointers in the standard library have counterparts in other crates that
  don't need heap memory. If possible, use those.

**Stack Allocation**:
- Everything not using a smart pointer type will be allocated on the stack.
- Structs, enums, iterators, arrays, and closures are all stack allocated.
- Cell types (`RefCell`) behave like smart pointers, but are stack-allocated.
- Inlining (`#[inline]`) will not affect allocation behavior for better or worse.
- Types that are marked `Copy` are guaranteed to have their contents stack-allocated.

**Global Allocation**:
- `const` is a fixed value; the compiler is allowed to copy it wherever useful.
- `static` is a fixed reference; the compiler will guarantee it is unique.

And if you've read through both the posts and now the summary: thanks. I've enjoyed
the process that went into writing this, and I hope it's valuable to you as well.