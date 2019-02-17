---
layout: post
title: "Insane Allocators: segfaults in safe Rust"
description: "\"Trusting trust\" with allocators."
category: rust, memory
tags: []
---

Having recently spent a lot of time down rabbit holes looking at how
[Rust uses memory](/2019/02/understanding-allocations-in-rust.html),
I like to think I finally understand the rules well enough to
break them. See, Rust will go so far as to claim:

> If all you do is write Safe Rust, you will never have to worry about type-safety or memory-safety.
> You will never endure a dangling pointer, a use-after-free, or any other kind of Undefined Behavior.

-- [The Nomicon](https://doc.rust-lang.org/nomicon/meet-safe-and-unsafe.html)

...and subject to (relatively infrequent)
[borrow checker bugs](https://github.com/rust-lang/rust/labels/A-borrow-checker),
it's correct. There's ongoing work to [formalize](https://plv.mpi-sws.org/rustbelt/popl18/)
the rules and *prove* that Rust is safe, but for our purposes it's a reasonable assumption.

Until it isn't. It's totally possible for "safe" Rust programs
(under contrived circumstances) to encounter memory corruption.
It's even possible for these programs to
["segfault"](https://en.wikipedia.org/wiki/Segmentation_fault)
when using an unmodified compiler:

<script id="asciicast-ENIpRYpdDazCkppanf3LSCetX" src="https://asciinema.org/a/ENIpRYpdDazCkppanf3LSCetX.js" async></script>

# Wait, wat?

[Wat indeed.](https://www.destroyallsoftware.com/talks/wat)

There are two tricks used to pull this off. First, I'm making
use of a special environment variable in Linux called
[`LD_PRELOAD`](https://blog.fpmurphy.com/2012/09/all-about-ld_preload.html).
Matt Godbolt goes into [way more detail](https://www.youtube.com/watch?v=dOfucXtyEsU)
than I can cover, but the important bit is this: I can insert my own code in place of
functions typically implemented by the [C standard library](https://www.gnu.org/software/libc/).

Second, there's a very special implementation of [`malloc`](https://linux.die.net/man/3/malloc)
that is being picked up by `LD_PRELOAD`:

```rust
use std::ffi::c_void;
use std::ptr::null_mut;

// Start off with an empty pointer
static mut ALLOC: *mut c_void = null_mut();

#[no_mangle]
pub extern "C" fn malloc(size: usize) -> *mut c_void {
    unsafe { 
        // If we've never allocated anything, ask the operating system
        // for some memory...
        if ALLOC == null_mut() {
            // Use a `libc` binding to avoid recursive malloc calls
            ALLOC = libc::malloc(size)
        }
        // ...and then give that same section of memory to everyone
        // for all subsequent allocations, corrupting the location.
        return ALLOC;
    }
}
```

So how is it possible to run the Rust compiler in this environment?
`LD_PRELOAD` applies to all programs, so running `ls` will also
lead to memory corruption and crashing! The answer is that `sudo`
deletes environment variables like `LD_PRELOAD` and
`LD_LIBRARY_PATH` when running commands; it's possible to
crash `sudo` in the same way by using our evil `malloc`
implementation.

Finally, why does Rust 1.31 work, and 1.32 fail? The answer is in the
release notes:
[`jemalloc` is removed by default](https://blog.rust-lang.org/2019/01/17/Rust-1.32.0.html#jemalloc-is-removed-by-default).
In Rust 1.28 through 1.31, programs were statically compiled against
[jemalloc](http://jemalloc.net/) by default; our evil `malloc` implementation
never gets invoked because the program goes straight to the operating
system to request memory. However, it's still possible to trigger segfaults
in Rust programs from  1.28 - 1.31 by using the
[`System`](https://doc.rust-lang.org/std/alloc/struct.System.html)
global allocator. Rust programs prior to 1.28 aren't subject to this
`LD_PRELOAD` trick.

# So what?

It should be made very clear: the code demonstrated here isn't a
security issue. "Safe" Rust programs are only crashing in these
circumstances because the memory allocator is intentionally lying to it.
Even in mission critical systems, there are a lot of concerns beyond memory allocation; the
[F-35 Joint Strike Fighter coding standards](http://www.stroustrup.com/JSF-AV-rules.pdf)
don't even give it a full page. 

But this example does highlight an assumption of Rust's memory model
that I haven't seen discussed much: **safe Rust is safe if, and only if,
the allocator it relies on is "correct"**. And because writing a non-trivial allocator is
[fundamentally unsafe](https://doc.rust-lang.org/std/alloc/trait.GlobalAlloc.html#unsafety),
safe Rust will always rely on unsafe Rust somewhere.

That all said, know that "safe" Rust can only claim to be safe because it stands
on the shoulders of incredible developers working on jemalloc,
[kmalloc](https://linux-kernel-labs.github.io/master/labs/kernel_api.html#memory-allocation),
and others.
