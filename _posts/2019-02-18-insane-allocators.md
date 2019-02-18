---
layout: post
title: "Insane Allocators: segfaults in safe Rust"
description: "...and what it means to be \"safe.\""
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

Until it isn't. Under specific circumstances, it's totally possible for "safe"
Rust programs to encounter memory corruption and trigger a
["segfault"](https://en.wikipedia.org/wiki/Segmentation_fault).

To prove it, this demonstration was run using an unmodified compiler:

<script id="asciicast-ENIpRYpdDazCkppanf3LSCetX" src="https://asciinema.org/a/ENIpRYpdDazCkppanf3LSCetX.js" async></script>

# Wait, wat?

[Wat indeed.](https://www.destroyallsoftware.com/talks/wat)

There are two tricks needed to pull this off. First, I'm making
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
    // Note that we don't ever handle `free`; if the first object
    // we allocate gets freed, the memory address being given
    // to everyone becomes a "use-after-free" bug.
}
```

Because this implementation of `malloc` is intentionally broken,
every program run using this library will crash. And I mean *every*
program; if you use dynamic memory, you're going down.

So how is it possible to even run the compiler in this environment?
Shouldn't `LD_PRELOAD` cause `rustc` to encounter memory corruption
and crash too? The answer is that `sudo` deletes environment variables
like `LD_PRELOAD` and `LD_LIBRARY_PATH` when running commands.
It's technically possible to crash `sudo` in the same way using
our evil `malloc` implementation, but the default security policy
deletes the variables we need.

Finally, why does the program run when compiled with Rust 1.31, and not 1.32?
The answer is in the release notes:
[`jemalloc` is removed by default](https://blog.rust-lang.org/2019/01/17/Rust-1.32.0.html#jemalloc-is-removed-by-default).
In all versions of Rust through 1.31, executables are statically compiled against
[jemalloc](http://jemalloc.net/) by default; our dynamically loaded
evil `malloc` implementation never gets an opportunity to run. It's still
possible to trigger segfaults in Rust binaries from  1.28 to 1.31 by using the
[`System`](https://doc.rust-lang.org/std/alloc/struct.System.html)
global allocator, but programs prior to 1.28 aren't affected by this
`LD_PRELOAD` trick.

# So what?

I do want to clarify: the code demonstrated here isn't a
security issue, and doesn't call into question Rust's definition of "safe."
The code demonstrated here crashes because the memory allocator is lying to it.
And even in mission critical systems, safety concerns go way beyond allocators; the
[F-35 Joint Strike Fighter coding standards](http://www.stroustrup.com/JSF-AV-rules.pdf)
give memory allocation about 10 sentences total.

But this example does highlight an assumption of Rust's memory model
that I haven't seen discussed much: **safe Rust is safe if, and only if,
the allocator it relies on is "correct"**. And because writing an allocator is
[fundamentally unsafe](https://doc.rust-lang.org/std/alloc/trait.GlobalAlloc.html#unsafety),
Rust's promises will always rely on some amount of "unsafe" code.

That all said, know that "safe" Rust can claim to be so only because it stands
on the shoulders of incredible libraries like jemalloc,
[kmalloc](https://linux-kernel-labs.github.io/master/labs/kernel_api.html#memory-allocation),
and others. Without being able to trust the allocators, we'd have no reason
to trust the safety guarantees made by Rust. So to all the people
who make safe Rust possible - thanks.
