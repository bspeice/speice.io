---
layout: post
title: "Isomorphic Desktop Apps with Rust"
description: "and other buzzwords"
category: 
tags: [rust, javascript]
---

I tried to come up with an opening sentence that talked about Javascript without being overly dismissive.
Instead, you get this.

And the standard "it's not you, it's me" language applies here. Node pushed out the benefits of an
asynchronous event loop everywhere, and languages like [Python](https://www.python.org/dev/peps/pep-0492/) and
[Rust](https://github.com/rust-lang/rfcs/pull/2394) are getting in on the game. Javascript, despite being
a language that often makes you say "[wat](https://www.destroyallsoftware.com/talks/wat)", powers the
web.

---

But here's the thing: I don't like Javascript. I really don't. I don't like:

- having to manage incredibly complex Typescript/Babel/Webpack/Gulp toolchains
- having to know any of the above things exist
- languages where the [runtime specification](http://www.ecma-international.org/ecma-262/9.0/index.html)
  dramatically outpaces [anyone's having actually implemented](https://kangax.github.io/compat-table/es2016plus/)
  the runtime specification

---

But here's the thing: I don't like Javascript. I really don't. I cringe every time I hear the word "Webpack".
A part of me dies inside knowing that Babel exists to paper over the difference between what a committee
has decided [the language should be](http://www.ecma-international.org/ecma-262/9.0/index.html) and
[what actually exists](https://kangax.github.io/compat-table/es2016plus/). Not that anyone cares about my
opinion.

---

So, when I hear that "Webassembly" is going to be a thing, I'm thrilled. Requisite jokes about 
[Metal](https://www.destroyallsoftware.com/talks/the-birth-and-death-of-javascript) aside
([oh wait, they're not joking](https://www.reddit.com/r/rust/comments/8j7y1f/i_am_lachlansneff_creator_of_nebulet_a_rust/)),
this seems like a fundamentally good way to skip the Babel/Webpack mess and get straight to
allowing other languages to earn a share of the market that Javascript occupies.

And I get that [WebAssembly isn't trying to replace JavaScript](https://webassembly.org/docs/faq/#is-webassembly-trying-to-replace-javascript).
But I want Javascript gone.
