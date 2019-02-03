---
layout: post
title: "Compiler Optimizations: What It's Done Lately"
description: "A lot. The answer is a lot."
category: 
tags: [rust, understanding-allocations]
---

Up to this point, we've been discussing memory usage in the Rust language
by focusing on simple rules that are mostly right for small chunks of code.
We've spent time showing how those rules work themselves out in practice,
and become familiar with reading the assembly code needed to see each memory
type (global, stack, heap) in action.

But throughout the content so far, we've put a handicap on the code.
In the name of consistent and understandable results, we've asked the
compiler to pretty please leave the training wheels on. Now is the time
where we throw out all the rules and take the kid gloves off. As it turns out,
both the Rust compiler and the LLVM optimizers are incredibly sophisticated,
and we'll step back and let them do their job.

We'll still be looking at assembly code to understand what's going on,
but it's important to mention again: **please use automated tools like
[qadapt](https://crates.io/crates/qadapt) to double-check memory behavior**. 
It's far too easy to mis-read assembly in large code sections, you should
always have an automated tool verify behavior if you care about memory usage.
Similar to ["What Has My Compiler Done For Me Lately?"](https://www.youtube.com/watch?v=bSkpMdDe4g4),
we're just focused on interesting things the Rust language can do.

The guiding principal as we move forward is this: *optimizing compilers
won't produce worse assembly than we started with.* There won't be any
situations where stack allocations get moved to heap allocations.
There will, however,  be an opera of optimization.

# The Case of the Disappearing Box

# Vectors of Usual Size

# Dr. Array or: How I Learned to Love the Optimizer
