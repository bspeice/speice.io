---
layout: post
title: "new post"
description: ""
category: 
tags: []
---

# Designing the Test

My use case is as follows: ingest binary market data from
[IEX](https://iextrading.com/trading/market-data/) and turn it into
a format understandable by each library being tested. Then we'll
write a simple program to find total trade volume per ticker,
and the highest and lowest bid/ask price per ticker as well.

<span style="font-size: .8em">Note: Market data is the use case here
simply because IEX makes the data freely available; no code or analysis
in this blog is related to my past or present work.</span>

Now, the basic criteria used to evaluate each library:

1) The library must have cross-language support, and treat Rust as a
first-class citizen.

2) The schema must be able to evolve and add new fields. The information
I'm gathering now is fairly simple, but would evolve in the future.

3) Performance is a priority; material performance differences
(time to de/serialize, memory usage) matter.

Under those three criteria, we're excluding a lot of systems that
may make sense in other contexts:

- [Bincode](https://github.com/servo/bincode) has great Rust support
and a simple wire format (message structure) but isn't usable from
other languages and doesn't deal well with schema evolution.

- [Protocol Buffers](https://developers.google.com/protocol-buffers/) have
great cross-language support, but material performance issues compared
to other systems like FlatBuffers.

- JSON/Msgpack are schema-less; while the wire format is simple,
having code generated from a schema is too nice to pass up.

While each of these have a niche they perform well in, they're not
suited for the system under consideration.