---
layout: post
title: "Binary Format Shootout - Prologue: Nom"
description: "Making sense of binary streams"
category: 
tags: [rust, binary-shootout]
---

I've been interested in using a binary protocol library for personal projects recently,
and found myself with a strong case of decision paralysis. Do I use
[Cap'n Proto](https://capnproto.org/), which has supported Rust the longest?
[Flatbuffers](https://google.github.io/flatbuffers) recently added support,
or I could take a look at [SBE](https://github.com/real-logic/simple-binary-encoding).
Or what about building something myself? A lot of these seem unnecessarily
complicated, when my personal use case is just providing views on top of
buffers with a relatively simple structure.

Even in my personal projects, I want the choices to be the best possible;
I hate the feeling of looking back at anything I've built and saying "I regret
that decision and I could have done better." So after agonizing over the choice
of protocol library for too long, I decided it would be worth building a test
to get a feel for each. It would give me a way to build a proof-of-concept
and become familiar with how each library worked, what the performance
characteristics were of each, and evaluate whether it was worth putting
in the effort of building yet another binary protocol library myself.

To that end, this is the summation of research into the binary protocol
systems that currently support Rust. The goal isn't to recommend "the best,"
but to understand each well enough to make an informed decision.

My use case is as follows: ingest binary market data from
[IEX](https://iextrading.com/trading/market-data/) and turn it into
a format understandable by each library being tested. We'll later
write a simple program to analyze the data.

<span style="font-size: .8em">Note: Market data is the use case here
simply because IEX makes the data freely available; no code or analysis
in this blog is related to my past or present work.</span>

But before we can run any analysis, we need to read in the files
supplied by IEX. To do that, we'll use a library in Rust
called [`nom`](https://docs.rs/nom/5.0.1/nom/).

# Ingesting Market Data
