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

How else do you explain people working on systems that complete the round trip of market data in to orders out (a.k.a. tick-to-trade) [within 750-800 nanoseconds](https://stackoverflow.com/a/22082528/1454178)?
In roughly the time it takes other computers to access [main memory 8 times](https://people.eecs.berkeley.edu/~rcs/research/interactive_latency.html), these systems are capable of reading the market data packets, deciding what orders to send, (presumably) doing risk checks, creating new packets for exchange-specific protocols, and putting those packets on the wire.

Having now worked in the trading industry, I can confirm the developers are mortal; I've made some simple mistakes at the very least. But more to the point, I think what sets high-performance systems apart is philosophy, not technique. Performance-critical systems don't rely on C++ optimization tricks to make code fast (though they can be helpful); rather, the problems these systems care about are very different than most other software. There are two principles I think are worth mentioning and reflecting on:

1. Focus on variance first, overall speed comes later.
2. Don't do unnecessary work.

# Variance First

Don't get me wrong, I'm a much happier person when things are fast. Computer now boots up in 9 seconds after switching from spinning plates to solid-state? Awesome. However, when it comes to code, speeding up a function by 10 microseconds doesn't mean anything if the variance of that function is ±1000μs. You may have improved on average, but the function is too noisy for this to be a meaningful change. **Fundamentally, high-performance code should optimize for time variance first**. Once you're consistent, then you can focus on improving overall time.

But you don't have to take my word for it (emphasis added in all quotes below):

- In [marketing materials](https://business.nasdaq.com/market-tech/marketplaces/trading) for NASDAQ's matching engine, they specifically call out variance:
    > Able to consistently sustain an order rate of over 100,000 orders per second at **sub-40 microsecond average latency**

- The [Aeron](https://github.com/real-logic/aeron) message bus has this to say about performance:
    > Performance is the key focus. Aeron is designed to be the highest throughput with the lowest and **most predictable latency possible** of any messaging system

- The company PolySync, which is working on autonomous vehicles, [mentions why](https://polysync.io/blog/session-types-for-hearty-codecs/) they picked their specific messaging format:
    > In general, high performance is almost always desirable for serialization. But in the world of autonomous vehicles, **steady timing performance is even more important** than peak throughput. This is because safe operation is sensitive to timing outliers. Nobody wants the system that decides when to slam on the brakes to occasionally take 100 times longer than usual to encode its commands.

So how exactly does one go about looking for and eliminating performance variance? To tell the truth, I don't think a systematic answer or flow-chart exists. There's no substitute for (A) building a deep understanding of the technology being used, and (B) actually measuring the code through benchmarks. And even then, each project cares about performance to a different degree; you may need to build an entire [replica production system](https://www.youtube.com/watch?v=NH1Tta7purM&feature=youtu.be&t=3015) to accurately benchmark at nanosecond precision. Alternately, you may be content if you never trigger garbage collection in Java.

Even though each high-performance project has different needs, there are still common things to look for when trying to isolate variance. In my experience, these also come up in interviews, so pay attention. In no particular order, here are potential sources of timing variability in high-performance code:

## Kernel

**Scheduling**: Set the [processor affinity](https://en.wikipedia.org/wiki/Processor_affinity) of your program, and make sure only your program can run on that processor. It's impossible to know how long it is until your program begins running again, so never let other processes use your precious CPU. Also, turning on [`CONFIG_NO_HZ_IDLE=y` or `CONFIG_NO_HZ_FULL=y`](https://github.com/torvalds/linux/blob/master/Documentation/timers/NO_HZ.txt) and turning off hyper-threading are probably good ideas.

**System calls**: Reading from a UNIX socket? Writing to a file? In addition to not knowing how long the I/O operation takes, these all trigger expensive [system calls](https://en.wikipedia.org/wiki/System_call). To handle these, the CPU must [context switch](https://en.wikipedia.org/wiki/Context_switch) to the kernel, let the kernel operation complete, then context switch back to your program. Similar to issues with scheduling, we want to make sure that our program is running at all times.

**Signal Handling**: Far less likely to be an issue, but does trigger a context switch if your code has a handler registered. This will be highly dependent on the application, but strategies like [blocking signals](https://www.linuxprogrammingblog.com/all-about-linux-signals?page=show#Blocking_signals) are available.

**Allocation**: Any time you call `new` in Java, or `std::make_shared` in C++, you're asking the system to provide you with exclusive access to chunks of memory. However, searching for blocks of memory that are ready for you to use takes a variable amount of time. Allocation libraries have a great deal of sophisticated strategies to deal with this, but it's unknown how long it may take to find available space.

**Interrupts**: System interrupts are how devices connected to your computer notify the CPU that something has happened. It's then up to the CPU to pause whatever program is running so the operating system can handle the interrupt. We don't want our program to be the one paused, so make sure that [SMP affinity](http://www.alexonlinux.com/smp-affinity-and-proper-interrupt-handling-in-linux) is set and the interrupts are handled on a CPU core not running the program we care about.

Code gets fast when you care about consistency. So where is inconsistency introduced?

- Kernel
    - Scheduling; Make sure you pin the core you're executing on, and that nobody else can use that core.
    - Context switching/syscalls; reading data from the network requires switching into the kernel unless you use openonload or other kernel bypass. Never do I/O on main thread unless you need that data to continue the program (epoll market data for example)
    - Allocation; Finding space in memory has inconsistent timing because of fragmentation
    - Interrupts
- Languages
    - JIT in Java; Hotspot may decide now is the time to compile your code into native format, and need to wait for that to finish. Alternately, may decide to decompile back into Java bitcode, and you're waiting for that process.
    - GC in Java; Same issue as allocations in the kernel, use object pooling strategies to bypass
- Hardware
    - CPU pipelining; can use code inlining as a hint, but branch predictor might guess incorrectly and have to rewind
    - Cache-local operations/Main memory access; need to go through MMU and page tables, etc. If you can keep things cache local, don't have to worry about how long it may take for DRAM access. For multi-socket computers, make sure all lookups are on the same NUMA node as the CPU.
    - DMA/Open Onload

# Don't do unnecessary work

- Don't recompute results - see the C++ template trick to go down buy/sell-specific code paths
- Stack frames are not free; jumping around isn't helpful if you can inline and help out the instruction cache
- Copies are not free

# Miscellaneous

- Do you know where you care about latency? If any humans are involved, none of these tools make a difference, the humans are already too slow
- If you benchmark, are you benchmarking in a way that's actually helpful? All the same variance rules from above apply to your benchmarks