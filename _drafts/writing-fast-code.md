---
layout: post
title: "On Building High Performance Systems"
description: ""
category: 
tags: []
---

Prior to working in the trading industry, my assumption was that High Frequency Trading (HFT) is made up of people who have access to secret techniques mortal developers could only dream of. There had to be some secret art that could only be learned if one had an appropriately tragic backstory:

<img src="/assets/images/2019-04-24-kung-fu.webp" alt="kung-fu fight">
> How I assumed HFT people learn their secret techniques

How else do you explain people working on systems that complete the round trip of market data in to orders out (a.k.a. tick-to-trade) consistently within [750-800 nanoseconds](https://stackoverflow.com/a/22082528/1454178)?
In roughly the time it takes other computers to access [main memory 8 times](https://people.eecs.berkeley.edu/~rcs/research/interactive_latency.html), trading systems are capable of reading the market data packets, deciding what orders to send, (presumably) doing risk checks, creating new packets for exchange-specific protocols, and putting those packets on the wire.

Having now worked in the trading industry, I can confirm the developers are mortal; I've made some simple mistakes at the very least. But more to the point, what shows up from reading public discussions is that philosophy, not technique, separates high-performance systems from everything else. Performance-critical systems don't rely on C++ optimization tricks to make code fast (though they can be useful); there's a lot more to worry about than just the code written for the project. Rather, what shows up time and again is a focus on variance, and reducing the gap between the fastest and slowest runs of the same code.

Don't get me wrong, I'm a much happier person when things are fast. Computer goes from booting in 20 seconds down to 10 because I installed a solid-state drive? Awesome. But if every other day it takes a full 30 seconds to boot up because of corrupted sectors? Not so great. When it comes to code, speeding up a function by an average 10 milliseconds doesn't mean much if there's a 1000ms difference between your fastest and slowest runs; you simply won't know until you call the function how long it takes to complete. **High-performance systems should first optimize for time variance**. Once you're consistent at the time scale you care about, then focus on improving overall time.

This focus on variance shows up all the time in public discussions (emphasis added in all quotes below):

- In [marketing materials](https://business.nasdaq.com/market-tech/marketplaces/trading) for NASDAQ's matching engine, they specifically call out variance:
    > Able to consistently sustain an order rate of over 100,000 orders per second at **sub-40 microsecond average latency**

- The [Aeron](https://github.com/real-logic/aeron) message bus has this to say about performance:
    > Performance is the key focus. Aeron is designed to be the highest throughput with the lowest and **most predictable latency possible** of any messaging system

- The company PolySync, which is working on autonomous vehicles, [mentions why](https://polysync.io/blog/session-types-for-hearty-codecs/) they picked their specific messaging format:
    > In general, high performance is almost always desirable for serialization. But in the world of autonomous vehicles, **steady timing performance is even more important** than peak throughput. This is because safe operation is sensitive to timing outliers. Nobody wants the system that decides when to slam on the brakes to occasionally take 100 times longer than usual to encode its commands.

- [Solarflare](https://solarflare.com/), which makes highly-specialized network hardware, points out variance as a big concern for [electronic trading](https://solarflare.com/electronic-trading/):
    > The high stakes world of electronic trading, investment banks, market makers, hedge funds and exchanges demand the **lowest possible latency and jitter** while utilizing the highest bandwidth and return on their investment.

One more important thing to note: we're not discussing *total runtime*, but variance of that total runtime. For example, trading firms use [wireless networks](https://sniperinmahwah.wordpress.com/2017/06/07/network-effects-part-i/) because the speed of light through air is faster than through fiber-optic cables. However, there's still at *absolute minimum* a [~33.76 millisecond](http://tinyurl.com/y2vd7tn8) delay required to send data between, say, [Chicago and Tokyo](https://www.theice.com/market-data/connectivity-and-feeds/wireless/tokyo-chicago) (unless [neutrinos](https://arxiv.org/pdf/1203.2847.pdf) become [a thing](https://news.ycombinator.com/item?id=10979340)). If a trading system in Chicago calls the function for "send order to Tokyo" and waits for a result, there's a fundamental limit to how long that will take. The focus should be to keep variance of any additional processing time to a minimum.

So how exactly does one go about looking for and eliminating performance variance? To tell the truth, I don't think a systematic answer or flow-chart exists. There's no substitute for (A) building a deep understanding of the entire technology stack, and (B) actually measuring system performance (though (C) watching a lot of [CppCon](https://www.youtube.com/channel/UCMlGfpWw-RUdWX_JbLCukXg) videos never hurt). Even then, each project cares about performance to a different degree; you may need to build an entire [replica production system](https://www.youtube.com/watch?v=NH1Tta7purM&feature=youtu.be&t=3015) to accurately benchmark at nanosecond precision. Alternately, you may be content to simply [avoid garbage collection](https://www.youtube.com/watch?v=BD9cRbxWQx8&feature=youtu.be&t=1335) in your Java code.

Even though everyone has different needs, there are still common things to look for when trying to isolate variance. In no particular order, these are valuable places to focus on when thinking about variance in high-performance systems:

## Language-specific

**Garbage Collection**: How often does garbage collection happen? What are the impacts?
- [In Python](https://rushter.com/blog/python-garbage-collector/), individual objects are collected if the reference count reaches 0, and each generation is collected if `num_alloc - num_dealloc > gc_threshold` whenever an allocation happens. The GIL is acquired for the duration of generational collection.
- Java has [many](https://docs.oracle.com/en/java/javase/12/gctuning/parallel-collector1.html#GUID-DCDD6E46-0406-41D1-AB49-FB96A50EB9CE) [different](https://docs.oracle.com/en/java/javase/12/gctuning/garbage-first-garbage-collector.html#GUID-ED3AB6D3-FD9B-4447-9EDF-983ED2F7A573) [collection](https://docs.oracle.com/en/java/javase/12/gctuning/garbage-first-garbage-collector-tuning.html#GUID-90E30ACA-8040-432E-B3A0-1E0440AB556A) [algorithms](https://docs.oracle.com/en/java/javase/12/gctuning/z-garbage-collector1.html#GUID-A5A42691-095E-47BA-B6DC-FB4E5FAA43D0) to choose from, each with different characteristics. The default algorithms (Parallel GC in Java 8, G1 in Java 9) freeze the JVM while collecting, while more recent algorithms ([ZGC](https://wiki.openjdk.java.net/display/zgc) and [Shenandoah](https://wiki.openjdk.java.net/display/shenandoah)) are designed to keep "stop the world" to a minimum by doing collection work in parallel.

**Allocation**: Every language has a different way of interacting with "heap" memory, but the principle is the same; figuring out what chunks of memory are available to give to a program is complex. Allocation libraries have a great deal of sophisticated strategies to deal with this, but it's unknown how long it may take to find available space. Understanding when your language interacts with the allocator is crucial (and I wrote [a guide for Rust](https://speice.io/2019/02/understanding-allocations-in-rust.html)).

**Data Layout**: How your data is arranged in memory matters; [data-oriented design](https://www.youtube.com/watch?v=yy8jQgmhbAU) and [cache locality](https://www.youtube.com/watch?v=2EWejmkKlxs&feature=youtu.be&t=1185) can have huge impacts on performance. The C family of languages (C, value types in C#, C++) and Rust all have guarantees about the shape every object takes in memory that others (like Java and Python) can't make. [Cachegrind](http://valgrind.org/docs/manual/cg-manual.html) and kernel [perf](https://perf.wiki.kernel.org/index.php/Main_Page) counters are both great for understanding how performance relates to memory layout.

**Just-In-Time Compilation**: Languages that are compiled on the fly (LuaJIT, C#, Java, PyPy) are great because they optimize your program for how it's actually being used. However, there's a variance cost associated with this because the virtual machine may stop executing while it waits for translation from VM bytecode to native code. As a remedy, some languages now support ahead-of-time compilation ([CoreRT](https://github.com/dotnet/corert) in C# and [GraalVM](https://www.graalvm.org/) in Java). On the other hand, LLVM supports [Profile Guided Optimization](https://clang.llvm.org/docs/UsersManual.html#profile-guided-optimization), which should bring JIT-like benefits to non-JIT languages. Benchmarking is incredibly important here.

**Programming Tricks**: These won't make or break performance, but can be useful in specific circumstances. For example, C++ can use [templates instead of branches](https://www.youtube.com/watch?v=NH1Tta7purM&feature=youtu.be&t=1206).

## Kernel

Code you wrote is almost certainly not the *only* code running on your system. There are many ways the operating system interacts with your program, from system calls to memory allocation, that are important to watch for. These are written from a Linux perspective, but Windows does typically have equivalent functionality.

**Scheduling**: Set the [processor affinity](https://en.wikipedia.org/wiki/Processor_affinity) of your program (typically using [taskset](https://linux.die.net/man/1/taskset)), and make sure only your program can run on that processor. The kernel, by default, is free to schedule any process on any core, so it's important to reserve CPU cores exclusively for the important programs. Also, turning on [`NO_HZ`](https://github.com/torvalds/linux/blob/master/Documentation/timers/NO_HZ.txt) and turning off hyper-threading are probably good ideas.

**System calls**: Reading from a UNIX socket? Writing to a file? In addition to not knowing how long the I/O operation takes, these all trigger expensive [system calls (syscalls)](https://en.wikipedia.org/wiki/System_call). To handle these, the CPU must [context switch](https://en.wikipedia.org/wiki/Context_switch) to the kernel, let the kernel operation complete, then context switch back to your program. We'd rather keep these to a minimum. [Strace](https://linux.die.net/man/1/strace) is your friend for understanding when and where syscalls happen.

**Signal Handling**: Far less likely to be an issue, but signals do trigger a context switch if your code has a handler registered. This will be highly dependent on the application, but you can [block signals](https://www.linuxprogrammingblog.com/all-about-linux-signals?page=show#Blocking_signals) if it's an issue.

**Interrupts**: System interrupts are how devices connected to your computer notify the CPU that something has happened. It's then up to the CPU to pause whatever program is running so the operating system can handle the interrupt. We don't want our program to be the one paused, so make sure that [SMP affinity](http://www.alexonlinux.com/smp-affinity-and-proper-interrupt-handling-in-linux) is set and the interrupts are handled on a CPU core not running the program we care about.

**[NUMA](https://www.kernel.org/doc/html/latest/vm/numa.html)**: While NUMA is good at making multi-cell systems transparent, there are variance implications; if the kernel moves a process across nodes, future memory accesses must wait for the controller on the original node. Use [numactl](https://linux.die.net/man/8/numactl) to handle memory/cpu pinning.

## Hardware

**CPU Pipelining/Speculation**: Speculative execution in modern processors gave us vulnerabilities like Spectre, but it also gave us performance improvements like [branch prediction](https://stackoverflow.com/a/11227902/1454178). However, there's variance involved because the CPU might mis-predict. And while the compiler knows a lot about how your CPU [pipelines instructions](https://youtu.be/nAbCKa0FzjQ?t=4467), code can be [structured to help](https://www.youtube.com/watch?v=NH1Tta7purM&feature=youtu.be&t=755) the branch predictor.

**Paging**: For most systems, virtual memory is incredible. Applications live in their own worlds, and the CPU/[MMU](https://en.wikipedia.org/wiki/Memory_management_unit) figures out the details afterward. However, there's a variance penalty associated with memory paging and caching; if you access more memory pages than the [TLB](https://en.wikipedia.org/wiki/Translation_lookaside_buffer) can store, you'll have to wait for the page walk. Kernel perf tools are necessary to figure out if this is an issue, but techniques like [huge pages](https://blog.pythian.com/performance-tuning-hugepages-in-linux/) can reduce TLB burdens. Alternately, running applications in a hypervisor like [Jailhouse](https://github.com/siemens/jailhouse) allows one to skip virtual memory entirely, but this is potentially more work than the benefits are worth.

**Network Interfaces**: When more than one computer is involved, variance can go up dramatically. Tuning kernel [network parameters](https://github.com/leandromoreira/linux-network-performance-parameters) may be helpful, but modern systems more frequently opt to skip the kernel altogether with a technique called [kernel bypass](https://blog.cloudflare.com/kernel-bypass/). This typically requires specialized hardware and [custom drivers](https://www.openonload.org/), but even industries like [telecom](https://www.bbc.co.uk/rd/blog/2018-04-high-speed-networking-open-source-kernel-bypass) are finding the benefits.

## Networks

**Routing**: There's a reason financial firms are willing to pay [millions of euros](https://sniperinmahwah.wordpress.com/2019/03/26/4-les-moeres-english-version/) for rights to a small plot of land - having a straight-line connection from point A to point B means the path their data takes is incredibly simple. In contrast, there are currently 6 computers in between me and Google, but that may change at any moment that my ISP realizes a [more efficient route](https://en.wikipedia.org/wiki/Border_Gateway_Protocol) is available. Whether it's using [research-quality equipment](https://sniperinmahwah.wordpress.com/2018/05/07/shortwave-trading-part-i-the-west-chicago-tower-mystery/) for shortwave radio, or just making sure there's no data inadvertently going between data centers, routing matters.

**Protocol**: TCP as a network protocol is awesome: guaranteed and in-order delivery, flow control, and congestion control all built in. But these attributes make the most sense when networking infrastructure is reasonably lossy. For systems that expect nearly all packets to be delivered correctly, the setup handshaking and packet acknowledgment are just overhead. Using UDP (unicast or multicast) may make sense in these contexts as it avoids the chatter needed to track connection state, and [gap-fill](https://iextrading.com/docs/IEX%20Transport%20Specification.pdf) [strategies](http://www.nasdaqtrader.com/content/technicalsupport/specifications/dataproducts/moldudp64.pdf) can handle the rest. 

**Switching**: Many routers/switches handle packets by waiting for the whole packet, validating checksums, and then sending to the next device. This behavior is referred to as "store-and-forward." In variance terms, the time needed to move data between two nodes is proportional to the size of that data; the switch must "store" all data before it can calculate checksums and "forward" to the next node. With [cut-through](https://www.networkworld.com/article/2241573/latency-and-jitter--cut-through-design-pays-off-for-arista--blade.html) designs, switches will begin forwarding data as soon as they know where the destination is, checksums be damned. For communications within a datacenter, this can have a huge benefit.

# Final Thoughts

High-performance systems, whether military, finance, or autonomous cars, are not magical. They do require precision and attention to detail, but much of the tech is available to regular people. Interested in seeing how context switching affects performance of your benchmarks? `taskset` should be installed in all modern Linux distributions. Curious how often garbage collection triggers during a crucial operation? Your language of choice will typically expose details of its operations ([Python](https://docs.python.org/3/library/gc.html), [Java](https://www.oracle.com/technetwork/java/javase/tech/vmoptions-jsp-140102.html#DebuggingOptions)). Want to know how hard your program is stressing the TLB? Use `perf record` and look for `dtlb_load_misses.miss_causes_a_walk`.

Two final caveats then. First, before attempting to apply some of the technology above to your own systems, can you first identify [where/when you care](http://wiki.c2.com/?PrematureOptimization) about "high-performance"? If there's ongoing human involvement with parts of the system, those likely don't need to worry about things like CPU pinning; humans are already far too slow to react in time.

Second, if you're using benchmarks, are they being designed in a way that's actually helpful? Tools like [Criterion](http://www.serpentine.com/criterion/) (also in [Rust](https://github.com/bheisler/criterion.rs)) and Google's [Benchmark](https://github.com/google/benchmark) output not only average run time, but variance as well; your benchmarking environment is subject to the same concerns your production environment is.

Finally then, I believe high-performance systems are a matter of philosophy, not necessarily technique. Rigorous focus on variance matters most, and there are plenty of ways to measure and mitigate it; once that's at an acceptable level, then optimize for speed.
