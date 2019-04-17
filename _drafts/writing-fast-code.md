---
layout: post
title: "Writing Fast Code"
description: ""
category: 
tags: []
---

The thing that has surprised me the most about low-latency trading systems I've worked on is simply that they aren't magical. The vast majority run on commodity Intel processors (FPGA's are being used, but are pretty niche), and while the developers are incredibly smart and talented, they're still mortals.

Rather, what I believe sets these systems apart is a relentless focus on a few philosophical differences. It's not that C++ metaprogramming tricks make all the difference (though they can be helpful), but that the goals of a trading system are from inception very different than most other software. There are two principles in place:

1. It's impossible to make code fast if it's inconsistent.
2. Don't do unnecessary work.

# Reducing variance

Code gets fast when you care about consistency. So where is inconsistency introduced?

- Kernel
    - Scheduling; Make sure you pin the core you're executing on, and that nobody else can use that core.
    - Context switching/syscalls; reading data from the network requires switching into the kernel unless you use openonload or other kernel bypass. Never do I/O on main thread unless you need that data to continue the program (epoll market data for example)
    - Allocation; Finding space in memory has inconsistent timing because of fragmentation
- Languages
    - JIT in Java; Hotspot may decide now is the time to compile your code into native format, and need to wait for that to finish. Alternately, may decide to decompile back into Java bitcode, and you're waiting for that process.
    - GC in Java; Same issue as allocations in the kernel, use object pooling strategies to bypass
- Hardware
    - CPU pipelining; can use code inlining as a hint, but branch predictor might guess incorrectly and have to rewind
    - Main-memory access; need to go through MMU and page tables, etc. If you can keep things cache local, don't have to worry about how long it may take for DRAM access. For multi-socket computers, make sure all lookups are on the same NUMA node as the CPU.

# Don't do unnecessary work

- Don't recompute results - see the C++ template trick to go down buy/sell-specific code paths
- Stack frames are not free; jumping around isn't helpful if you can inline and help out the instruction cache
- Copies are not free

# Miscellaneous

- Do you know where you care about latency? If any humans are involved, none of these tools make a difference, the humans are already too slow
- If you benchmark, are you benchmarking in a way that's actually helpful? All the same variance rules from above apply to your benchmarks