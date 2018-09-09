---
layout: post
title: "Isomorphic Desktop Apps with Rust"
description: "Electron + WASM = ☣"
category: 
tags: [rust, javascript, webassembly]
---

Forgive me, but this is going to be a bit of a schizophrenic post. I both despise Javascript and the
modern ECMAScript ecosystem, and I'm stunned by its success at doing some things I think are really cool.
And it's [this duality](https://www.destroyallsoftware.com/talks/the-birth-and-death-of-javascript)
that led me to a couple of (very) late nights over the past weeks trying to reconcile myself.

See, as much as [Webassembly isn't trying to replace Javascript](https://webassembly.org/docs/faq/#is-webassembly-trying-to-replace-javascript),
**I want Javascript gone**. There are plenty of people who do not share my views, and they are probably
nicer and more fun at parties. But I cringe every time "Webpack" is mentioned, and I think it's hilarious
that the [language specification](https://ecma-international.org/publications/standards/Ecma-402.htm)
dramatically outpaces anyone's [actually implementing](https://kangax.github.io/compat-table/es2016plus/)
the spec. The answer to this conundrum is of course to have a "polyfill" that translates
code from newer versions of the language to older versions of the language. At least
[Babel] is a nice tongue-in-cheek reference.

And yet, for as much hate as [Electron] receives, it does a stunningly good job at solving
a really hard problem: *how the hell do I put a button on the screen and react when the user clicks it*?
GUI programming is hard, straight up. But if browsers are already able to run everywhere, why don't
we take advantage of someone else solving the hard problems for us? Don't reinvent wheels. I don't like
that I have to use Javascript for it, but I apparently don't mind Javascript enough that I feel inclined to
whip out good ol' [wxWidgets].

Now, there are other "native" solutions ([libui-rs], [conrod], [oh hey wxWdidgets again!][wxRust]),
but those also potentially have their own issues with distribution, styling, etc.
With Electron, I can `yarn create electron-app my-app` and just get going, knowing that distribution/upgrades/etc.
are built in.

So the question is: given recent innovations with WASM, *are we Electron yet*?

No, not really.

Instead, **what would it take to get to a point where we can skip Javascript in Electron apps?**

# Setting the Stage

Truth is, WASM/Webassembly is a pretty new technology and I'm generally unfamiliar with the tools.
There may already be solutions to the issues I discuss, but I'm totally unaware of them,
so I'm going to try and organize what I know exists.

I should also mention that the content and things I'm talking about here are not intended to be prescriptive,
but more "if someone else is interested, where should you start?" *I expect everything in this post to be irrelevant
within two months.* Even over the course of writing this, [a blog post](https://mnt.io/2018/08/28/from-rust-to-beyond-the-asm-js-galaxy/)
was invalidated because [upstream changes](https://github.com/WebAssembly/binaryen/pull/1642)
broke [a Rust tool](https://github.com/rustwasm/wasm-bindgen/pull/787) that ultimately
[forced changes in the blog post](https://mnt.io/2018/08/28/from-rust-to-beyond-the-asm-js-galaxy/#comment-477).
**And all that happened within the span of a week.** Things are moving quickly.

I'll also note that we're going to skip [asm.js] and [emscripten]. Truth be told, I couldn't get either of these
to produce anything, and so I'm just going to say [here be dragons.](https://en.wikipedia.org/wiki/Here_be_dragons)
Everything I'm discussing here is using the `wasm32-unknown-unknown` target.

And the code that I *did* get running is available [over here](https://github.com/bspeice/isomorphic_rust).
Feel free to use that as a starting point, but I'm mostly including the link as a reference point for the things
that do and don't work.

# An Example Running Application

So, I did *technically* get a running application:

![Electron app using WASM](/assets/images/2018-09-08-electron-percy-wasm.png)

...which you can also try out if you want to:

```sh
git clone https://github.com/bspeice/isomorphic_rust.git
cd isomorphic_rust/percy
yarn install && yarn start
```

...but I really wouldn't use this as a "high quality" starting point. It's mostly just there
to prove that this is possible in the first place. And that's something to be proud of!
There's a huge amount of engineering that went into showing a window with the text "It's alive!".

There's also a huge number of issues under the hood that prevent me from recommending anyone
try using Electron and WASM at the moment, and I think that's the more important thing to discuss.

# Issues:

- Have to use wasm-bindgen so symbols get exported and are usable
- Have to use webpack/babel after bindgen so we can compile to something that's usable in a browser
- yew doesn't require wasm_bindgen, but doesn't link via webpack (env module) - think this is a stdweb issue
- Electron forces us to deal with MIME types - open webpack issue
- Incompatible low-level utilities - js-sys exists, but very fragmented with web-sys, stdweb, percy-webapis
- Can't include Cargo.lock so wasm-bindgen-cli is updated:
    error: failed to extract wasm-bindgen custom sections
        caused by:

    it looks like the Rust project used to create this wasm file was linked against
    a different version of wasm-bindgen than this binary:

    rust wasm file: 0.2.21
        this binary: 0.2.17

    Currently the bindgen format is unstable enough that these two version must
    exactly match, so it's required that these two version are kept in sync by
    either updating the wasm-bindgen dependency or this binary. You should be able
    to update the wasm-bindgen dependency with:

        cargo update -p wasm-bindgen

    or you can update the binary with

        cargo install -f wasm-bindgen-cli

    if this warning fails to go away though and you're not sure what to do feel free
    to open an issue at https://github.com/rustwasm/wasm-bindgen/issues!

    error Command failed with exit code 1.
    info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.

- Things I didn't try: wasm-pack to publish to NPM or local registry and pull down from there, static file server in Electron

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