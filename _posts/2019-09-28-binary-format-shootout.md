---
layout: post
title: "Binary Format Shootout"
description: "Cap'n Proto vs. Flatbuffers vs. SBE"
category: 
tags: [rust]
---

I've found that in many personal projects, [analysis paralysis](https://en.wikipedia.org/wiki/Analysis_paralysis)
is particularly deadly. Making good decisions in the beginning avoids pain and suffering later;
if extra research prevents future problems, I'm happy to continue ~~procrastinating~~ researching indefinitely.

So let's say you're in need of a binary serialization format. Data will be going over the network, not just in memory,
so having a schema document and code generation is a must. Performance is crucial, so formats that support zero-copy
de/serialization are given priority. And the more languages supported, the better; I use Rust,
but can't predict what other languages this could interact with.

Given these requirements, the candidates I could find were:

1. [Cap'n Proto](https://capnproto.org/) has been around the longest, and is the most established
2. [Flatbuffers](https://google.github.io/flatbuffers/) is the newest, and claims to have a simpler encoding
3. [Simple Binary Encoding](https://github.com/real-logic/simple-binary-encoding) has the simplest encoding,
   but the Rust implementation is unmaintained

Any one of these will satisfy the project requirements: easy to transmit over a network, reasonably fast,
and polyglot support. But how do you actually pick one? It's impossible to know what issues will follow that choice,
so I tend to avoid commitment until the last possible moment.

Still, a choice must be made. Instead of worrying about which is "the best," I decided to build a small 
proof-of-concept system in each format and pit them against each other. All code can be found in the
[repository](https://github.com/speice-io/marketdata-shootout) for this post.

We'll discuss more in detail, but a quick preview of the results:

- Cap'n Proto: Theoretically performs incredibly well, the implementation had issues
- Flatbuffers: Has some quirks, but largely lived up to its "zero-copy" promises
- SBE: Best median and worst-case performance, but the message structure has a limited feature set

# Prologue: Binary Parsing with Nom

Our benchmark system will be a simple data processor; given depth-of-book market data from
[IEX](https://iextrading.com/trading/market-data/#deep), serialize each message into the schema format,
read it back, and calculate total size of stock traded and the lowest/highest quoted prices. This test
isn't complex, but is representative of the project I need a binary format for.

But before we make it to that point, we have to actually read in the market data. To do so, I'm using a library
called [`nom`](https://github.com/Geal/nom). Version 5.0 was recently released and brought some big changes,
so this was an opportunity to build a non-trivial program and get familiar.

If you don't already know about `nom`, it's a "parser generator". By combining different smaller parsers,
you can assemble a parser to handle complex structures without writing tedious code by hand.
For example, when parsing [PCAP files](https://www.winpcap.org/ntar/draft/PCAP-DumpFileFormat.html#rfc.section.3.3):

```
   0                   1                   2                   3
   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
   +---------------------------------------------------------------+
 0 |                    Block Type = 0x00000006                    |
   +---------------------------------------------------------------+
 4 |                      Block Total Length                       |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 8 |                         Interface ID                          |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
12 |                        Timestamp (High)                       |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
16 |                        Timestamp (Low)                        |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
20 |                         Captured Len                          |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
24 |                          Packet Len                           |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   |                          Packet Data                          |
   |                              ...                              |
```

...you can build a parser in `nom` that looks like
[this](https://github.com/speice-io/marketdata-shootout/blob/369613843d39cfdc728e1003123bf87f79422497/src/parsers.rs#L59-L93):

```rust
const ENHANCED_PACKET: [u8; 4] = [0x06, 0x00, 0x00, 0x00];
pub fn enhanced_packet_block(input: &[u8]) -> IResult<&[u8], &[u8]> {
    let (
        remaining,
        (
            block_type,
            block_len,
            interface_id,
            timestamp_high,
            timestamp_low,
            captured_len,
            packet_len,
        ),
    ) = tuple((
        tag(ENHANCED_PACKET),
        le_u32,
        le_u32,
        le_u32,
        le_u32,
        le_u32,
        le_u32,
    ))(input)?;

    let (remaining, packet_data) = take(captured_len)(remaining)?;
    Ok((remaining, packet_data))
}
```

While this example isn't too interesting, more complex formats (like IEX market data) are where
[`nom` really shines](https://github.com/speice-io/marketdata-shootout/blob/369613843d39cfdc728e1003123bf87f79422497/src/iex.rs).

Ultimately, because the `nom` code in this shootout was the same for all formats, we're not too interested in its performance.
Still, it's worth mentioning that building the market data parser was actually fun; I didn't have to write tons of boring code by hand.

# Part 1: Cap'n Proto

Now it's time to get into the meaty part of the story. Cap'n Proto was the first format I tried because of how long
it has supported Rust (thanks to [dwrensha](https://github.com/dwrensha) for maintaining the Rust port since
[2014!](https://github.com/capnproto/capnproto-rust/releases/tag/rustc-0.10)). However, I had a ton of performance concerns
once I started using it.

To serialize new messages, Cap'n Proto uses a "builder" object. This builder allocates memory on the heap to hold the message
content, but because builders [can't be re-used](https://github.com/capnproto/capnproto-rust/issues/111), we have to allocate
a new buffer for every single message. I was able to work around this with a
[special builder](https://github.com/speice-io/marketdata-shootout/blob/369613843d39cfdc728e1003123bf87f79422497/src/capnp_runner.rs#L17-L51)
that could re-use the buffer, but it required reading through Cap'n Proto's
[benchmarks](https://github.com/capnproto/capnproto-rust/blob/master/benchmark/benchmark.rs#L124-L156)
to find an example, and used [`std::mem::transmute`](https://doc.rust-lang.org/std/mem/fn.transmute.html) to bypass Rust's borrow checker.

The process of reading messages was better, but still had issues. Cap'n Proto has two message encodings: a ["packed"](https://capnproto.org/encoding.html#packing)
representation, and an "unpacked" version. When reading "packed" messages, we need a buffer to unpack the message into before we can use it;
Cap'n Proto allocates a new buffer for each message we unpack, and I wasn't able to figure out a way around that.
In contrast, the unpacked message format should be where Cap'n Proto shines; its main selling point is that there's [no decoding step](https://capnproto.org/).
However, accomplishing zero-copy deserialization required code in the private API ([since fixed](https://github.com/capnproto/capnproto-rust/issues/148)),
and we allocate a vector on every read for the segment table.

In the end, I put in significant work to make Cap'n Proto as fast as possible, but there were too many issues for me to feel comfortable
using it long-term.

# Part 2: Flatbuffers

This is the new kid on the block. After a [first attempt](https://github.com/google/flatbuffers/pull/3894) didn't pan out,
official support was [recently launched](https://github.com/google/flatbuffers/pull/4898). Flatbuffers intends to address
the same problems as Cap'n Proto: high-performance, polyglot, binary messaging. The difference is that Flatbuffers claims
to have a simpler wire format and [more flexibility](https://google.github.io/flatbuffers/flatbuffers_benchmarks.html).

On the whole, I enjoyed using Flatbuffers; the [tooling](https://crates.io/crates/flatc-rust) is nice, and unlike
Cap'n Proto, parsing messages was actually zero-copy and zero-allocation. However, there were still some issues.

First, Flatbuffers (at least in Rust) can't handle nested vectors. This is a problem for formats like the following:

```
table Message {
  symbol: string;
}
table MultiMessage {
  messages:[Message];
}
```

We want to create a `MultiMessage` which contains a vector of `Message`, and each `Message` itself contains a vector (the `string` type).
I was able to work around this by [caching `Message` elements](https://github.com/speice-io/marketdata-shootout/blob/e9d07d148bf36a211a6f86802b313c4918377d1b/src/flatbuffers_runner.rs#L83)
in a `SmallVec` before building the final `MultiMessage`, but it was a painful process that I believe contributed to poor serialization performance.

Second, streaming support in Flatbuffers seems to be something of an [afterthought](https://github.com/google/flatbuffers/issues/3898).
Where Cap'n Proto in Rust handles reading messages from a stream as part of the API, Flatbuffers just sticks a `u32` at the front of each
message to indicate the size. Not specifically a problem, but calculating message size without that tag is nigh on impossible.

Ultimately, I enjoyed using Flatbuffers, and had to do significantly less work to make it perform well.

# Part 3: Simple Binary Encoding

Support for SBE was added by the author of one of my favorite
[Rust blog posts](https://web.archive.org/web/20190427124806/https://polysync.io/blog/session-types-for-hearty-codecs/).
I've [talked previously]({% post_url 2019-06-31-high-performance-systems %}) about how important variance is in
high-performance systems, so it was encouraging to read about a format that
[directly addressed](https://github.com/real-logic/simple-binary-encoding/wiki/Why-Low-Latency) my concerns. SBE has by far
the simplest binary format, but it does make some tradeoffs.

Both Cap'n Proto and Flatbuffers use [message offsets](https://capnproto.org/encoding.html#structs) to handle
variable-length data, [unions](https://capnproto.org/language.html#unions), and various other features. In contrast,
messages in SBE are essentially [just structs](https://github.com/real-logic/simple-binary-encoding/blob/master/sbe-samples/src/main/resources/example-schema.xml);
variable-length data is supported, but there's no union type.

As mentioned in the beginning, the Rust port of SBE works well, but is
[essentially unmaintained](https://users.rust-lang.org/t/zero-cost-abstraction-frontier-no-copy-low-allocation-ordered-decoding/11515/9).
However, if you don't need union types, and can accept that schemas are XML documents, it's still worth using. SBE's implementation
had the best streaming support of all formats I tested, and doesn't trigger allocation during de/serialization.

# Results

After building a test harness [for](https://github.com/speice-io/marketdata-shootout/blob/master/src/capnp_runner.rs)
[each](https://github.com/speice-io/marketdata-shootout/blob/master/src/flatbuffers_runner.rs)
[format](https://github.com/speice-io/marketdata-shootout/blob/master/src/sbe_runner.rs),
it was time to actually take them for a spin. I used
[this script](https://github.com/speice-io/marketdata-shootout/blob/master/run_shootout.sh) to run the benchmarks,
and the raw results are [here](https://github.com/speice-io/marketdata-shootout/blob/master/shootout.csv). All data
reported below is the average of 10 runs on a single day of IEX data. Results were validated to make sure
that each format parsed the data correctly.

## Serialization

This test measures, on a
[per-message basis](https://github.com/speice-io/marketdata-shootout/blob/master/src/main.rs#L268-L272),
how long it takes to serialize the IEX message into the desired format and write to a pre-allocated buffer.

| Schema               | Median | 99th Pctl | 99.9th Pctl | Total  |
|:---------------------|:-------|:----------|:------------|:-------|
| Cap'n Proto Packed   | 413ns  | 1751ns    | 2943ns      | 14.80s |
| Cap'n Proto Unpacked | 273ns  | 1828ns    | 2836ns      | 10.65s |
| Flatbuffers          | 355ns  | 2185ns    | 3497ns      | 14.31s |
| SBE                  | 91ns   | 1535ns    | 2423ns      | 3.91s  |

## Deserialization

This test measures, on a
[per-message basis](https://github.com/speice-io/marketdata-shootout/blob/master/src/main.rs#L294-L298),
how long it takes to read the previously-serialized message and
perform some basic aggregation. The aggregation code is the same for each format,
so any performance differences are due solely to the format implementation.

| Schema               | Median | 99th Pctl | 99.9th Pctl | Total  |
|:---------------------|:-------|:----------|:------------|:-------|
| Cap'n Proto Packed   | 539ns  | 1216ns    | 2599ns      | 18.92s |
| Cap'n Proto Unpacked | 366ns  | 737ns     | 1583ns      | 12.32s |
| Flatbuffers          | 173ns  | 421ns     | 1007ns      | 6.00s  |
| SBE                  | 116ns  | 286ns     | 659ns       | 4.05s  |

# Conclusion

Building a benchmark turned out to be incredibly helpful in making a decision; because a
"union" type isn't important to me, I can be confident that SBE best addresses my needs.

While SBE was the fastest in terms of both median and worst-case performance, its worst case
performance was proportionately far higher than any other format. It seems to be that de/serialization
time scales with message size, but I'll need to do some more research to understand what exactly
is going on.
