---
layout: post
title: "A Case Study in Heaptrack"
description: "...because you don't need no garbage collection "
category: 
tags: []
---

One of the first conversations I had about programming went like this:

> Programmers have it too easy these days. They should learn to develop
> in low memory environments and be efficient.
>
> -- My Father (paraphrased)

Though it's not like the first code I wrote was for a
[graphing calculator](https://education.ti.com/en/products/calculators/graphing-calculators/ti-84-plus-se),
packing a whole 24KB of RAM. By the way, *what are you doing on my lawn?*

The principle remains though: be efficient with the resources you're given, because
[what Intel giveth, Microsoft taketh away](http://exo-blog.blogspot.com/2007/09/what-intel-giveth-microsoft-taketh-away.html).
My professional work has been focused on this kind of efficiency; low-latency financial markets force
you to understand deeply *exactly* what your code is doing. As I've been experimenting with Rust for
personal projects, I'm glad to see that it's possible to bring that mindset with me. There's flexibility for
programming as if there was a garbage collector, and flexibility for the times when I really care about efficiency.

This post is a (small) case study in how I went from the former to the latter. And it's an attempt to prove how easy
it is for you to do the same.

# The Starting Line

When I first started building the [dtparse] crate, my intention was to mirror as closely as possible the logic from
the equivalent [Python library][dateutil]. Python, as you may know, is garbage collected. Very rarely is memory
usage considered in Python, and so I likewise wasn't paying attention when `dtparse` was first being built.

That works out well enough, and I'm not planning on tuning the crate for memory usage.
But every so often I wondered "what exactly is going on in memory?" With the advent of Rust 1.28 and the
[Global Allocator trait](https://doc.rust-lang.org/std/alloc/trait.GlobalAlloc.html), I had a really great idea:
*build a custom allocator that allows you to track your own allocations.* That way, you can do things like
writing tests for both correct results and correct memory usage. I gave it a [shot][qadapt], but learned
very quickly: **never write your own allocator**. It very quickly turned from "fun weekend project" into
"I have literally no idea what my computer is doing."

Instead, let's highlight another (easier) way you can make sense of your memory usage: [heaptrack]

# Turning on the System Allocator

This is the hardest part of the post. Because Rust uses
[its own allocator](https://github.com/rust-lang/rust/pull/27400#issue-41256384) by default,
`heaptrack` is unable to properly record what your code is actually doing. We have to
instead compile our programs with some special options to make it work.

Specifically, in `lib.rs` or `main.rs`, make sure you add this:

```rust
use std::alloc::System;

#[global_allocator]
static GLOBAL: System = System;
```

Or look [here](https://blog.rust-lang.org/2018/08/02/Rust-1.28.html) for another example.

# Running heaptrack

Assuming you've installed heaptrack <span style="font-size: .6em;">(Homebrew in Mac, package manager in Linux, ??? in Windows)</span>,
all that's left is to fire it up:

```
heaptrack my_application
```

It's that easy. After the program finishes, you'll see a file in your local directory with a name
like `heaptrack.my_appplication.XXXX.gz`. If you load that up in `heaptrack_gui`, you'll see
something like this:

![heaptrack](/assets/images/2018-10-heaptrack/heaptrack-before.png)

---

And even these pretty colors:

![pretty colors](/assets/images/2018-10-heaptrack/heaptrack-flamegraph.png)

# Reading Flamegraphs

We're going to focus on the heap ["flamegraph"](http://www.brendangregg.com/flamegraphs.html),
which is the last picture I showed above. Normally these charts are used to show how much time
you spend executing different functions, but the focus for now is to show how much memory
was allocated during those functions.

I'm not going to spend too much time on how to read flamegraphs, but the idea is this:
The width of the bar is how much memory was allocated by that function, and all functions
that it calls.

For example, we can see that all executions happened during the `main` function:

![allocations in main](/assets/images/2018-10-heaptrack/heaptrack-main-colorized.png)

...and within that, all allocations happened during `dtparse::parse`:

![allocations in dtparse](/assets/images/2018-10-heaptrack/heaptrack-dtparse-colorized.png)

...and within *that*, allocations happened in two main places:

![allocations in parseinfo](/assets/images/2018-10-heaptrack/heaptrack-parseinfo-colorized.png)

Now I apologize that it's hard to see, but there's one area specifically that stuck out
as an issue: **what the heck is the `Default` thing doing?**

![pretty colors](/assets/images/2018-10-heaptrack/heaptrack-flamegraph-default.png)

# Optimizing dtparse

See, I knew that there were some allocations that happen during the `dtparse::parse` method,
but I was totally wrong about where the bulk of allocations occurred in my program.
Let me post the code and see if you can spot the mistake:

```rust
/// Main entry point for using `dtparse`.
pub fn parse(timestr: &str) -> ParseResult<(NaiveDateTime, Option<FixedOffset>)> {
    let res = Parser::default().parse(
        timestr, None, None, false, false,
        None, false,
        &HashMap::new(),
    )?;

    Ok((res.0, res.1))
}
```
> [dtparse](https://github.com/bspeice/dtparse/blob/4d7c5dd99572823fa4a390b483c38ab020a2172f/src/lib.rs#L1286)

---

The issue is that I keep on creating a new `Parser` every time you call the `parse()` function!

Now this is a bit excessive, but was necessary at the time because `Parser.parse()` used `&mut self`.
In order to properly parse a string, the parser itself required mutable state.

So, I put some time in to
[make the parser immutable](https://github.com/bspeice/dtparse/commit/741afa34517d6bc1155713bbc5d66905fea13fad#diff-b4aea3e418ccdb71239b96952d9cddb6),
and now I could re-use the same parser over and over. And would you believe it? No more allocations of default parsers:

![allocations cleaned up](/assets/images/2018-10-heaptrack/heaptrack-flamegraph-after.png)

In total, we went from requiring 2 MB of memory:

![memory before](/assets/images/2018-10-heaptrack/heaptrack-closeup.png)

All the way down to 300KB:

![memory after](/assets/images/2018-10-heaptrack/heaptrack-closeup-after.png)

# Conclusion

In the end, you don't need to write a custom allocator to test memory performance. Rather, there are some
pretty good tools that already exist you can make use of!

**Use them.**

Now that [Moore's Law](https://en.wikipedia.org/wiki/Moore%27s_law)
is [dead](https://www.technologyreview.com/s/601441/moores-law-is-dead-now-what/), we've all got to
do our part to take back what Microsoft stole.

[dtparse]: https://crates.io/crates/dtparse
[dateutil]: https://github.com/dateutil/dateutil
[heaptrack]: https://github.com/KDE/heaptrack
[qadapt]: https://crates.io/crates/qadapt
