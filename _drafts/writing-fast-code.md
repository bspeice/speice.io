---
layout: post
title: "On Writing High Performance Code"
description: ""
category: 
tags: []
---

Prior to working in the trading industry, my assumption was that High Frequency Trading (HFT) is made up of people who have access to secret techniques the rest of us mortal developers could only dream of. There had to be some lost art of trading that could only be learned if one had an appropriately tragic backstory:

<img src="/assets/images/2019-04-24-kung-fu.webp" alt="kung-fu fight">
> How I assumed HFT people learn their secret techniques

How else do you explain people working on systems that complete the round trip of market data in to orders out (a.k.a. tick-to-trade) [consistently within 750-800 nanoseconds](https://stackoverflow.com/a/22082528/1454178)?
In roughly the time it takes other computers to access [main memory 8 times](https://people.eecs.berkeley.edu/~rcs/research/interactive_latency.html), these systems are capable of reading the market data packets, deciding what orders to send, (presumably) doing risk checks, creating new packets for exchange-specific protocols, and putting those packets on the wire.

Having now worked in the trading industry, I can confirm the developers are mortal; I've made some simple mistakes at the very least. But more to the point, what shows up from reading public discussions is that philosophy, not technique, separates high-performance systems from everything else. Performance-critical systems don't rely on C++ optimization tricks to make code fast (though they're definitely useful); rather, there are two governing principles I want to reflect on:

1. Focus on variance (average latency) first, overall speed comes later.
2. Don't do unnecessary work.

# Variance First

Don't get me wrong, I'm a much happier person when things are fast. Computer now boots up in 9 seconds after switching from spinning plates to solid-state? Awesome. But if the computer takes a full 60 seconds to boot up tomorrow? Not so great. When it comes to code, speeding up a function by 10 milliseconds doesn't mean much if the variance of that function is ±1000ms; you simply won't know until you call the function how long it takes to complete. **High-performance code should first optimize for time variance**. Once you're consistent, then you can focus on improving overall time.

But you don't have to take my word for it (emphasis added in all quotes below):

- In [marketing materials](https://business.nasdaq.com/market-tech/marketplaces/trading) for NASDAQ's matching engine, they specifically call out variance:
    > Able to consistently sustain an order rate of over 100,000 orders per second at **sub-40 microsecond average latency**

- The [Aeron](https://github.com/real-logic/aeron) message bus has this to say about performance:
    > Performance is the key focus. Aeron is designed to be the highest throughput with the lowest and **most predictable latency possible** of any messaging system

- The company PolySync, which is working on autonomous vehicles, [mentions why](https://polysync.io/blog/session-types-for-hearty-codecs/) they picked their specific messaging format:
    > In general, high performance is almost always desirable for serialization. But in the world of autonomous vehicles, **steady timing performance is even more important** than peak throughput. This is because safe operation is sensitive to timing outliers. Nobody wants the system that decides when to slam on the brakes to occasionally take 100 times longer than usual to encode its commands.

So how exactly does one go about looking for and eliminating performance variance? To tell the truth, I don't think a systematic answer or flow-chart exists. There's no substitute for (A) building a deep understanding of the entire technology stack, and (B) actually measuring the code through benchmarks. And even then, each project cares about performance to a different degree; you may need to build an entire [replica production system](https://www.youtube.com/watch?v=NH1Tta7purM&feature=youtu.be&t=3015) to accurately benchmark at nanosecond precision. Alternately, you may be content to simply avoid garbage collection in your Java code.

Even though everyone has different needs, there are still common things to look for when trying to isolate variance. In no particular order, these are places to focus on when building high-performance/low-latency systems:

## Language-specific

**Garbage Collection**: How often does garbage collection happen? What are the impacts?
- [In Python](https://rushter.com/blog/python-garbage-collector/), individual objects are collected if the reference count reaches 0, and each generation is collected if `num_alloc - num_dealloc > gc_threshold` whenever an allocation happens. The GIL is acquired for the duration of generational collection.
- Java has [many](https://docs.oracle.com/en/java/javase/12/gctuning/parallel-collector1.html#GUID-DCDD6E46-0406-41D1-AB49-FB96A50EB9CE) [different](https://docs.oracle.com/en/java/javase/12/gctuning/garbage-first-garbage-collector.html#GUID-ED3AB6D3-FD9B-4447-9EDF-983ED2F7A573) [collection](https://docs.oracle.com/en/java/javase/12/gctuning/garbage-first-garbage-collector-tuning.html#GUID-90E30ACA-8040-432E-B3A0-1E0440AB556A) [algorithms](https://docs.oracle.com/en/java/javase/12/gctuning/z-garbage-collector1.html#GUID-A5A42691-095E-47BA-B6DC-FB4E5FAA43D0) to choose from, each with different characteristics. The default algorithms (Parallel GC in Java 8, G1 in Java 9) freeze the JVM while collecting, while more recent algorithms ([ZGC](https://wiki.openjdk.java.net/display/zgc) and [Shenandoah](https://wiki.openjdk.java.net/display/shenandoah)) are designed to keep "stop the world" to a minimum by doing collection work in parallel.

**Allocation**: Every language has a different way of interacting with "heap" memory, but the principle is the same; figuring out what chunks of memory are available to give to a program is complex. Allocation libraries have a great deal of sophisticated strategies to deal with this, but it's unknown how long it may take to find available space. Understanding when your language interacts with the allocator is crucial (and I wrote [a guide for Rust](https://speice.io/2019/02/understanding-allocations-in-rust.html)).

**Data Layout**: Your CPU does a lot of work to keep things running quickly, from [speculative execution](https://www.youtube.com/watch?v=_f7O3IfIR2k) to [caching](https://www.youtube.com/watch?v=vDns3Um39l0&feature=youtu.be&t=1311). And when it comes to caching, how your data is arranged in memory matters. The C family (C, value types in C#, C++) and Rust all have guarantees about layout; from the CPU's perspective, if the work has been done to retrieve one part of a structure from main memory, other parts are likely available in the cache without needing to contact main memory again. Java and Python don't make these same guarantees, so the CPU may have to wait more often on memory lookups. [Cachegrind](http://valgrind.org/docs/manual/cg-manual.html) is great for understanding what's going on.

**Just-In-Time Compilation**: Languages that are compiled on the fly (LuaJIT, C#, Java, PyPy) are great because they optimize your program for how it's actually being used. However, there's a variance cost associated with this; the virtual machine may stop executing while it waits for translation from VM bytecode to native code. As a remedy, some languages now support ahead-of-time compilation ([CoreRT](https://github.com/dotnet/corert) in C# and [GraalVM](https://www.graalvm.org/) in Java). On the other hand, LLVM supports [Profile Guided Optimization](https://clang.llvm.org/docs/UsersManual.html#profile-guided-optimization), which should bring JIT-like benefits to non-JIT languages. Benchmarking is incredibly important here.

## Kernel

Code you wrote is likely not the *only* code running on your system. There are many ways the operating system interacts with your program, from system calls to memory allocation, that are important to be aware of.

**Scheduling**: Set the [processor affinity](https://en.wikipedia.org/wiki/Processor_affinity) of your program, and make sure only your program can run on that processor. The kernel, by default, is free to schedule any process on any core, so it's important to reserve CPU cores exclusively for the important programs. Also, turning on [`NO_HZ`](https://github.com/torvalds/linux/blob/master/Documentation/timers/NO_HZ.txt) and turning off hyper-threading are probably good ideas.

**System calls**: Reading from a UNIX socket? Writing to a file? In addition to not knowing how long the I/O operation takes, these all trigger expensive [system calls (syscalls)](https://en.wikipedia.org/wiki/System_call). To handle these, the CPU must [context switch](https://en.wikipedia.org/wiki/Context_switch) to the kernel, let the kernel operation complete, then context switch back to your program. We'd rather keep these to a minimum. [Strace](https://linux.die.net/man/1/strace) is your friend for understanding when and where syscalls happen.

**Signal Handling**: Far less likely to be an issue, but does trigger a context switch if your code has a handler registered. This will be highly dependent on the application, but you can [block signals](https://www.linuxprogrammingblog.com/all-about-linux-signals?page=show#Blocking_signals) if it's an issue.

**Interrupts**: System interrupts are how devices connected to your computer notify the CPU that something has happened. It's then up to the CPU to pause whatever program is running so the operating system can handle the interrupt. We don't want our program to be the one paused, so make sure that [SMP affinity](http://www.alexonlinux.com/smp-affinity-and-proper-interrupt-handling-in-linux) is set and the interrupts are handled on a CPU core not running the program we care about.

**[NUMA](https://www.kernel.org/doc/html/latest/vm/numa.html)**: While NUMA is good at making multi-cell systems transparent, there are variance implications; if the kernel moves a process across nodes, future memory accesses must wait for the controller on the original node. Use [numactl](https://linux.die.net/man/8/numactl) to handle memory/cpu pinning.

- Hardware
    - CPU pipelining; can use code inlining as a hint, but branch predictor might guess incorrectly and have to rewind
    - TLB/MMU/paging strategies;
    - Cache-local operations/Main memory access; need to go through MMU and page tables, etc. If you can keep things cache local, don't have to worry about how long it may take for DRAM access. For multi-socket computers, make sure all lookups are on the same NUMA node as the CPU.
    - DMA/Open Onload
- Networks
    - Internet routing - no idea what the network path looks like, so financial firms pay big money to make sure they have straight-line connections
    - Latency within the switch - cut-through vs. store-and-forward routing - https://www.networkworld.com/article/2241573/latency-and-jitter--cut-through-design-pays-off-for-arista--blade.html

# Don't do unnecessary work

- Don't recompute results - see the C++ template trick to go down buy/sell-specific code paths
- Stack frames are not free; jumping around isn't helpful if you can inline and help out the instruction cache
- Copies are not free

# Miscellaneous

- Do you know where you care about latency? If any humans are involved, none of these tools make a difference, the humans are already too slow
- If you benchmark, are you benchmarking in a way that's actually helpful? All the same variance rules from above apply to your benchmarks