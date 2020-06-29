---
layout: post
title: "What I Learned: Porting Dateutil Parser to Rust"
description: ""
category:
tags: [dtparse, rust]
---

Hi. I'm Bradlee.

I've mostly been a lurker in Rust for a while, making a couple small contributions here and there.
So launching [dtparse](https://github.com/bspeice/dtparse) feels like nice step towards becoming a
functioning member of society. But not too much, because then you know people start asking you to
pay bills, and ain't nobody got time for that.

But I built dtparse, and you can read about my thoughts on the process. Or don't. I won't tell you
what to do with your life (but you should totally keep reading).

# Slow down, what?

OK, fine, I guess I should start with _why_ someone would do this.

[Dateutil](https://github.com/dateutil/dateutil) is a Python library for handling dates. The
standard library support for time in Python is kinda dope, but there are a lot of extras that go
into making it useful beyond just the [datetime](https://docs.python.org/3.6/library/datetime.html)
module. `dateutil.parser` specifically is code to take all the super-weird time formats people come
up with and turn them into something actually useful.

Date/time parsing, it turns out, is just like everything else involving
[computers](https://infiniteundo.com/post/25326999628/falsehoods-programmers-believe-about-time) and
[time](https://infiniteundo.com/post/25509354022/more-falsehoods-programmers-believe-about-time): it
feels like it shouldn't be that difficult to do, until you try to do it, and you realize that people
suck and this is why
[we can't we have nice things](https://zachholman.com/talk/utc-is-enough-for-everyone-right). But
alas, we'll try and make contemporary art out of the rubble and give it a pretentious name like
_Time_.

![A gravel mound](/assets/images/2018-06-25-gravel-mound.jpg)

> [Time](https://www.goodfreephotos.com/united-states/montana/elkhorn/remains-of-the-mining-operation-elkhorn.jpg.php)

What makes `dateutil.parser` great is that there's single function with a single argument that
drives what programmers interact with:
[`parse(timestr)`](https://github.com/dateutil/dateutil/blob/6dde5d6298cfb81a4c594a38439462799ed2aef2/dateutil/parser/_parser.py#L1258).
It takes in the time as a string, and gives you back a reasonable "look, this is the best anyone can
possibly do to make sense of your input" value. It doesn't expect much of you.

[And now it's in Rust.](https://github.com/bspeice/dtparse/blob/7d565d3a78876dbebd9711c9720364fe9eba7915/src/lib.rs#L1332)

# Lost in Translation

Having worked at a bulge-bracket bank watching Java programmers try to be Python programmers, I'm
admittedly hesitant to publish Python code that's trying to be Rust. Interestingly, Rust code can
actually do a great job of mimicking Python. It's certainly not idiomatic Rust, but I've had better
experiences than
[this guy](https://webcache.googleusercontent.com/search?q=cache:wkYMpktJtnUJ:https://jackstouffer.com/blog/porting_dateutil.html+&cd=3&hl=en&ct=clnk&gl=us)
who attempted the same thing for D. These are the actual take-aways:

When transcribing code, **stay as close to the original library as possible**. I'm talking about
using the same variable names, same access patterns, the whole shebang. It's way too easy to make a
couple of typos, and all of a sudden your code blows up in new and exciting ways. Having a reference
manual for verbatim what your code should be means that you don't spend that long debugging
complicated logic, you're more looking for typos.

Also, **don't use nice Rust things like enums**. While
[one time it worked out OK for me](https://github.com/bspeice/dtparse/blob/7d565d3a78876dbebd9711c9720364fe9eba7915/src/lib.rs#L88-L94),
I also managed to shoot myself in the foot a couple times because `dateutil` stores AM/PM as a
boolean and I mixed up which was true, and which was false (side note: AM is false, PM is true). In
general, writing nice code _should not be a first-pass priority_ when you're just trying to recreate
the same functionality.

**Exceptions are a pain.** Make peace with it. Python code is just allowed to skip stack frames. So
when a co-worker told me "Rust is getting try-catch syntax" I properly freaked out. Turns out
[he's not quite right](https://github.com/rust-lang/rfcs/pull/243), and I'm OK with that. And while
`dateutil` is pretty well-behaved about not skipping multiple stack frames,
[130-line try-catch blocks](https://github.com/dateutil/dateutil/blob/16561fc99361979e88cccbd135393b06b1af7e90/dateutil/parser/_parser.py#L730-L865)
take a while to verify.

As another Python quirk, **be very careful about
[long nested if-elif-else blocks](https://github.com/dateutil/dateutil/blob/16561fc99361979e88cccbd135393b06b1af7e90/dateutil/parser/_parser.py#L494-L568)**.
I used to think that Python's whitespace was just there to get you to format your code correctly. I
think that no longer. It's way too easy to close a block too early and have incredibly weird issues
in the logic. Make sure you use an editor that displays indentation levels so you can keep things
straight.

**Rust macros are not free.** I originally had the
[main test body](https://github.com/bspeice/dtparse/blob/b0e737f088eca8e83ab4244c6621a2797d247697/tests/compat.rs#L63-L217)
wrapped up in a macro using [pyo3](https://github.com/PyO3/PyO3). It took two minutes to compile.
After
[moving things to a function](https://github.com/bspeice/dtparse/blob/e017018295c670e4b6c6ee1cfff00dbb233db47d/tests/compat.rs#L76-L205)
compile times dropped down to ~5 seconds. Turns out 150 lines \* 100 tests = a lot of redundant code
to be compiled. My new rule of thumb is that any macros longer than 10-15 lines are actually
functions that need to be liberated, man.

Finally, **I really miss list comprehensions and dictionary comprehensions.** As a quick comparison,
see
[this dateutil code](https://github.com/dateutil/dateutil/blob/16561fc99361979e88cccbd135393b06b1af7e90/dateutil/parser/_parser.py#L476)
and
[the implementation in Rust](https://github.com/bspeice/dtparse/blob/7d565d3a78876dbebd9711c9720364fe9eba7915/src/lib.rs#L619-L629).
I probably wrote it wrong, and I'm sorry. Ultimately though, I hope that these comprehensions can be
added through macros or syntax extensions. Either way, they're expressive, save typing, and are
super-readable. Let's get more of that.

# Using a young language

Now, Rust is exciting and new, which means that there's opportunity to make a substantive impact. On
more than one occasion though, I've had issues navigating the Rust ecosystem.

What I'll call the "canonical library" is still being built. In Python, if you need datetime
parsing, you use `dateutil`. If you want `decimal` types, it's already in the
[standard library](https://docs.python.org/3.6/library/decimal.html). While I might've gotten away
with `f64`, `dateutil` uses decimals, and I wanted to follow the principle of **staying as close to
the original library as possible**. Thus began my quest to find a decimal library in Rust. What I
quickly found was summarized in a comment:

> Writing a BigDecimal is easy. Writing a _good_ BigDecimal is hard.
>
> [-cmr](https://github.com/rust-lang/rust/issues/8937#issuecomment-34582794)

In practice, this means that there are at least [4](https://crates.io/crates/bigdecimal)
[different](https://crates.io/crates/rust_decimal)
[implementations](https://crates.io/crates/decimal) [available](https://crates.io/crates/decimate).
And that's a lot of decisions to worry about when all I'm thinking is "why can't
[calendar reform](https://en.wikipedia.org/wiki/Calendar_reform) be a thing" and I'm forced to dig
through a [couple](https://github.com/rust-lang/rust/issues/8937#issuecomment-31661916)
[different](https://github.com/rust-lang/rfcs/issues/334)
[threads](https://github.com/rust-num/num/issues/8) to figure out if the library I'm look at is dead
or just stable.

And even when the "canonical library" exists, there's no guarantees that it will be well-maintained.
[Chrono](https://github.com/chronotope/chrono) is the _de facto_ date/time library in Rust, and just
released version 0.4.4 like two days ago. Meanwhile,
[chrono-tz](https://github.com/chronotope/chrono-tz) appears to be dead in the water even though
[there are people happy to help maintain it](https://github.com/chronotope/chrono-tz/issues/19). I
know relatively little about it, but it appears that most of the release process is automated;
keeping that up to date should be a no-brainer.

## Trial Maintenance Policy

Specifically given "maintenance" being an
[oft-discussed](https://www.reddit.com/r/rust/comments/48540g/thoughts_on_initiators_vs_maintainers/)
issue, I'm going to try out the following policy to keep things moving on `dtparse`:

1. Issues/PRs needing _maintainer_ feedback will be updated at least weekly. I want to make sure
   nobody's blocking on me.

2. To keep issues/PRs needing _contributor_ feedback moving, I'm going to (kindly) ask the
   contributor to check in after two weeks, and close the issue without resolution if I hear nothing
   back after a month.

The second point I think has the potential to be a bit controversial, so I'm happy to receive
feedback on that. And if a contributor responds with "hey, still working on it, had a kid and I'm
running on 30 seconds of sleep a night," then first: congratulations on sustaining human life. And
second: I don't mind keeping those requests going indefinitely. I just want to try and balance
keeping things moving with giving people the necessary time they need.

I should also note that I'm still getting some best practices in place - CONTRIBUTING and
CONTRIBUTORS files need to be added, as well as issue/PR templates. In progress. None of us are
perfect.

# Roadmap and Conclusion

So if I've now built a `dateutil`-compatible parser, we're done, right? Of course not! That's not
nearly ambitious enough.

Ultimately, I'd love to have a library that's capable of parsing everything the Linux `date` command
can do (and not `date` on OSX, because seriously, BSD coreutils are the worst). I know Rust has a
coreutils rewrite going on, and `dtparse` would potentially be an interesting candidate since it
doesn't bring in a lot of extra dependencies. [`humantime`](https://crates.io/crates/humantime)
could help pick up some of the (current) slack in dtparse, so maybe we can share and care with each
other?

All in all, I'm mostly hoping that nobody's already done this and I haven't spent a bit over a month
on redundant code. So if it exists, tell me. I need to know, but be nice about it, because I'm going
to take it hard.

And in the mean time, I'm looking forward to building more. Onwards.
