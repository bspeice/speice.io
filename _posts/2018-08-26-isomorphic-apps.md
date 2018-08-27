---
layout: post
title: "Isomorphic Desktop Apps with Rust"
description: "and other buzzwords"
category: 
tags: [rust, javascript]
---

Forgive me, but this is going to be a bit of a schizophrenic post. I both absolutely hate Javascript
and the modern ECMAScript ecosystem, and I'm stunned by its success at doing some things I think
are really cool. And it's this duality that led me to a couple of nights up at 2 AM over the past
weeks trying to reconcile myself.

See, as much as [Webassembly isn't trying to replace Javascript](https://webassembly.org/docs/faq/#is-webassembly-trying-to-replace-javascript),
**I want to replace Javascript**. I cringe every time I hear the word "Webpack",
and I think it's hilarious that the [language specification](https://ecma-international.org/publications/standards/Ecma-402.htm)
dramatically outpaces anyone's ability [to actually implement](https://kangax.github.io/compat-table/es2016plus/)
the specification. The answer to this conundrum is of course to have a "polyfill" that actually recompiles
code from newer versions of the language to older versions of the language. At least
[Babel][babel] is a nice tongue-in-cheek reference.

And yet, for as much hate as [Electron][electron] receives, it does a stunningly good job at solving
a really hard problem: *how the hell do I put a button on the screen and react when the user clicks it*?
GUI programming is hard, straight up. But if browsers are already able to run everywhere, why don't
we take advantage of someone else solving the hard problems for us? Don't reinvent wheels. I hate
that I have to use Javascript for it, but I apparently don't hate Javascript enough to want to
whip out good ol' [wxWidgets][wxwidgets].

Now, there are other "native" solutions ([libui-rs][libui-rs], [conrod][conrod], [oh hey wxWdidgets again!][wxRust]),
but those also potentially have their own issues with distribution, styling, etc.
With Electron, I can `yarn create electron-app my-app` and just get going, knowing that distribution/upgrades/etc.
are built in.

So the question I want to answer is: **Are we Electron yet**?

<span style="color:white;">No. No we are not.</span>

# Technology Survey

The truth is, WASM/Webassembly is a pretty new technology, and there aren't a lot of nice tools. I knew going in
that there were going to be some rough edges, but was curious to see what could be done. Before I get to that
though, I need to explain a little bit of what the state of play is. **If you're already familiar with the WASM ecosystem,
[skip ahead a bit](#building-an-electron-app).**

First things first, we're going to skip [asm.js][asm.js] and [emscripten][emscripten]. Truth be told, I couldn't
get either of these to produce a usable binary, and so I'm just going to say [here be dragons.][https://en.wikipedia.org/wiki/Here_be_dragons]

So how does one go about producing a "Webassembly"? That's done by compiling to a separate *target*.
First, make sure the target is installed:

```
rustup install nightly # Just trust me on this one
rustup target add wasm32-unknown-unknown
```

And then we can build the project with:

```
cargo +nightly build --target=wasm32-unknown-unknown
```

Now, this produces a Webassembly/WASM file (in `target/wasm32-unknown-unknown/debug/`) that we can load in the
browser. However, the resulting blob isn't really easy to use; you'd have to write a lot of extra code
for Javascript to figure out what functions are actually usable. Fortunately, [wasm-bindgen][wasm-bindgen]
handles a lot of that for you (and is part of why we need nightly). The end result is that we can
easily allow Javascript to access Rust code.

This only gets you one-direction communication though. If you want to interact with Javascript,
[js-sys][js-sys] acts as a "header" library; it tells the Rust compiler "no trust me, these functions
will totally exist at runtime" and allows the compiler to generate your code.

If you want to interact with the Browser the answer is a bit complicated at the moment.
There are currently [three][stdweb] [different][percy-webapis] [libraries][web-sys]
that seek to do that, and only one of them has made it past version `0.0.1` ([stdweb][stdweb], it's stdweb).
That said, I expect [web-sys][web-sys] to be the long-term solution, so keep an eye on that one.

But we don't want to just interact with the browser, we want to build an entire application.
And since We Totally Need An Application Framework™, there are a couple of options available:
[virtual-dom-rs][virtual-dom-rs] (a.k.a. [percy][percy]), and [yew][yew]. From what I gather,
`virtual-dom-rs` is attempting to be [React][react], and `yew` is attempting to be [elm][elm].

Testing your applications is a bit tricky at the moment, and to be honest, I didn't manage to get that far.
If you're brave though, [cargo-web][cargo-web] has some nice handling to actually run your tests
inside a browser (we're using WASM, remember?). As a practical example, [percy][percy-test] has
a unit test or two to demonstrate, but it's pretty basic so far.

And while we won't cover it here, if you want to ship Webassembly code to NPM, you can do that
via [wasm-pack][wasm-pack]. It attempts to handle some of the difficult bits so that people who want
to use Javascript (not me) can get access to your code really easily.

So, that's a quick tour of the state of play. Things are in the early stages, so it's a bit difficult
to figure out who's doing what and why they exist, but this hopefully at least sets the stage.

# Building an Electron App

Now that you've managed to piece your way through a fragmented ecosystem ([not][gulpjs] [unlike][typescript]
[current][vuejs] [ECMAScript](https://benmccormick.org/2015/09/14/es5-es6-es2016-es-next-whats-going-on-with-javascript-versioning/)),
it's time to actually build an application. The code I'll be referring to is
[over here](https://github.com/bspeice/isomorphic_rust).

[wxwidgets]: https://wxwidgets.org/
[libui-rs]: https://github.com/LeoTindall/libui-rs/
[electron]: https://electronjs.org/
[babel]: https://github.com/babel/babel
[conrod]: https://github.com/PistonDevelopers/conrod
[wxRust]: https://github.com/kenz-gelsoft/wxRust
[wasm-bindgen]: https://github.com/rustwasm/wasm-bindgen
[js-sys]: https://crates.io/crates/js-sys
[percy-webapis]: https://crates.io/crates/percy-webapis
[stdweb]: https://crates.io/crates/stdweb
[web-sys]: https://crates.io/crates/web-sys
[percy]: https://chinedufn.github.io/percy/
[virtual-dom-rs]: https://crates.io/crates/virtual-dom-rs
[yew]: https://github.com/DenisKolodin/yew
[react]: https://reactjs.org/
[elm]: http://elm-lang.org/
[wasm-pack]: https://github.com/rustwasm/wasm-pack
[cargo-web]: https://github.com/koute/cargo-web
[percy-test]: https://github.com/chinedufn/percy/tree/master/examples/unit-testing-components
[asm.js]: http://asmjs.org/
[emscripten]: https://kripken.github.io/emscripten-site/
[gulpjs]: https://gulpjs.com/
[typescript]: https://www.typescriptlang.org/
[vuejs]: https://vuejs.org/