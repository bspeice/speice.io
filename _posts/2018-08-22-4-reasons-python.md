---
layout: post
title: "4 reasons I think Python is broken"
description: "but are super technical and not super convincing."
category: 
tags: []
---

<span style="font-size:.7em">*but are super technical and not very convincing.*</span>

I'm going to put on my hipster hot takes hat for a moment:

*I think Python has kinda made some mistakes.*


![Hipster](/assets/images/4-reasons-python/hipster.jpg)
> [Not me because I can't grow facial hair but wish I could][hipster]

And I get it; [there are two kinds of languages][stroustrup], and Python definitely
belongs to the "languages people complain about because they actually use them" camp.
That said, these are the reasons why I'm not super thrilled about Python and am 
avoiding it. The time has come to acknowledge that there are some bits of Python
that qualify as mistakes.

In no particular order, allow me to present my issues with Python.

# 1: No Boolean operator overloads

Language reserves `and`, `or` as keywords. Leads to issues in Pandas
where special care must be taken because bitwise `~` takes precedence over
comparison operators (`<`, `==`).

# 2: Poorly specified overloads

Specifically, `x < y` is not necessarily equivalent to `y > x`.

# 3: Global variable scoping



[hipster]: https://flic.kr/p/Tg9Cdv
[stroustrop]: https://en.wikiquote.org/wiki/Bjarne_Stroustrup