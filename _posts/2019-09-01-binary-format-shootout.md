---
layout: post
title: "Binary Format Shootout"
description: "Making sense of binary streams"
category: 
tags: [rust]
---

I've found that in many personal projects, [analysis paralysis](https://en.wikipedia.org/wiki/Analysis_paralysis)
is particularly deadly. There's nothing like having other options available to make you question your decisions.
There's a particular scenario that scares me: I'm a couple months into a project, only to realize that if I had
made a different choice at an earlier juncture, weeks of work could have been saved. If only an extra hour or
two of research had been conducted, everything would've turned out differently.

Let's say you're in need of a binary serialization schema for a project you're working on. Data will be going
over the network, not just in memory, so having a schema document is a must. Performance is important;
there's no reason to use Protocol Buffers when other projects support similar features at faster speed.
And it must be polyglot; Rust support needs to be there, but we can't predict what other languages this will
interact with.

Given these requirements, the formats I could find were:

1. [Cap'n Proto](https://capnproto.org/) has been around the longest, and integrates well with all the build tools
2. [Flatbuffers](https://google.github.io/flatbuffers/) is the newest, and claims to have a simpler encoding
3. [Simple Binary Encoding](https://github.com/real-logic/simple-binary-encoding) is being adopted by the
   [High-performance financial](https://www.fixtrading.org/standards/sbe/) community, but the Rust implementation
   is essentially unmaintained

Any one of these will satisfy the project requirements: easy to transmit over a network, reasonably fast,
and support multiple languages. But actually picking one to build a system on is intimidating; it's impossible
to know what issues that choice will lead to.

Still, a choice must be made. It's not particularly groundbreaking, but I decided to build a test system to help
understand how they all behave.

# Prologue: Reading the Data

Our benchmark will be a simple market data processor; given messages from [IEX](https://iextrading.com/trading/market-data/#deep),
serialize each message into the schema format, then read back each message to do some basic aggregation.

But before we make it to that point, we have to read in the market data. To do so, I'm using a library
called [`nom`](https://github.com/Geal/nom). Version 5.0 was recently released and brought some big changes,
so this was an opportunity to build a non-trivial program and see how it fared.

If you're not familiar with `nom`, the idea is to build a binary data parser by combining different
mini-parsers. For example, if your data looks like
[this](https://www.winpcap.org/ntar/draft/PCAP-DumpFileFormat.html#rfc.section.3.3):

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

...you can build a parser in `nom` like
[this](https://github.com/bspeice/speice.io-md_shootout/blob/369613843d39cfdc728e1003123bf87f79422497/src/parsers.rs#L59-L93):

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

This demonstration isn't too interesting, but when more complex formats need to be parsed (like IEX market data),
[`nom` really shines](https://github.com/bspeice/speice.io-md_shootout/blob/369613843d39cfdc728e1003123bf87f79422497/src/iex.rs).

Ultimately, because `nom` was used to parse the IEX-format market data before serialization, we're not too interested
in its performance. However, it's worth mentioning how much easier this project was because I didn't have to write
all the boring code by hand.

# Part 1: Cap'n Proto

Now it's time to get into the meaty part of the story. Cap'n Proto was the first format I tried because of how long
it has supported Rust. It was a bit tricky to get the compiler installed, but once that was done, the
[schema document](https://github.com/bspeice/speice.io-md_shootout/blob/369613843d39cfdc728e1003123bf87f79422497/marketdata.capnp)
wasn't hard to create.

In practice, I had a ton of issues with Cap'n Proto.

To serialize new messages, Cap'n Proto uses a "builder" object. This builder allocates memory on the heap to hold the message
content, but because builders [can't be re-used](https://github.com/capnproto/capnproto-rust/issues/111), we have to allocate
a new buffer for every single message. I was able to work around this and re-use memory with a
[special builder](https://github.com/bspeice/speice.io-md_shootout/blob/369613843d39cfdc728e1003123bf87f79422497/src/capnp_runner.rs#L17-L51),
but it required reading through Cap'n Proto's [benchmarks](https://github.com/capnproto/capnproto-rust/blob/master/benchmark/benchmark.rs#L124-L156)
to find an example usage and using `transmute` to bypass Rust's borrow checker.

Reading messages was similarly problematic. Cap'n Proto has two message encodings: a ["packed"](https://capnproto.org/encoding.html#packing)
version, and an unpacked version. When reading "packed" messages, we need to unpack the message before we can make use of it.
This allocates a new buffer for each message, and I wasn't able to find a way to get around this. Unpacked messages, however,
shouldn't require any allocation or decoding steps. In practice, because of a
[bounds check](https://github.com/capnproto/capnproto-rust/blob/master/capnp/src/serialize.rs#L60) on the payload size,
I had to [copy parts](https://github.com/bspeice/speice.io-md_shootout/blob/369613843d39cfdc728e1003123bf87f79422497/src/capnp_runner.rs#L255-L340)
of the Cap'n Proto API to read messages without allocation.

In the end, I put in significant work to make Cap'n Proto as fast as possible, but there were too many issues for me to feel
comfortable making use of Cap'n Proto.

# Final Results

NOTE: Need to expand on this, but numbers reported below are from the IEX's 2019-09-03 data, took average over 10 runs.

Serialization

|                      | median | 99th Pctl | 99.9th Pctl | Total  |
|----------------------|--------|-----------|-------------|--------|
| Cap'n Proto Packed   | 413ns  | 1751ns    | 2943ns      | 14.80s |
| Cap'n Proto Unpacked | 273ns  | 1828ns    | 2836ns      | 10.65s |
| Flatbuffers          | 355ns  | 2185ns    | 3497ns      | 14.31s |
| SBE                  | 91ns   | 1535ns    | 2423ns      | 3.91s  |

Deserialization

|                      | median | 99th Pctl | 99.9th Pctl | Total  |
|----------------------|--------|-----------|-------------|--------|
| Cap'n Proto Packed   | 539ns  | 1216ns    | 2599ns      | 18.92s |
| Cap'n Proto Unpacked | 366ns  | 737ns     | 1583ns      | 12.32s |
| Flatbuffers          | 173ns  | 421ns     | 1007ns      | 6.00s  |
| SBE                  | 116ns  | 286ns     | 659ns       | 4.05s  |
