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
the spec. The answer to this conundrum is of course to recompile code from newer versions of the language to
older versions. At least [Babel] is a nice tongue-in-cheek reference.

Yet for as much hate as [Electron] receives, it does a stunningly good job at solving
a really hard problem: *how the hell do I put a button on the screen and react when the user clicks it*?
GUI programming is hard, straight up. But if browsers are already able to run everywhere, why don't
we take advantage of someone else solving the hard problems for us? Don't reinvent wheels. I don't like
that I have to use Javascript for it, but I apparently don't mind Javascript enough that I feel inclined to
whip out good ol' [wxWidgets].

Now there are other native solutions ([libui-rs], [conrod], [oh hey wxWdidgets again!][wxRust]),
but those also potentially have their own issues with distribution, styling, etc.
With Electron, I can `yarn create electron-app my-app` and just get going, knowing that distribution/upgrades/etc.
are built in.

My question is: given recent innovations with WASM, *are we Electron yet*?

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

There's also a lot of usability issues that prevent me from recommending anyone try using Electron and WASM
at the moment, and I think that's the more important thing to discuss.

# Issue the First: Complicated Toolchains

I quickly established that [wasm-bindgen] was necessary to "link" my Rust code to Javascript. At that point
you've got an Electron app that starts an HTML page which fetches Javascript. To keep things simple, the goal
was to package everything using [webpack] so that I could just load a `bundle.js` file on the page.
That decision was to be the last thing that kinda worked in this process.

The first issue [I ran into](https://www.reddit.com/r/rust/comments/98lpun/unable_to_load_wasm_for_electron_application/)
while attempting to link things via Webpack is a detail in the WebAssembly spec:

> This function accepts a Response object, or a promise for one, and ...
> **[if it] does not match the `application/wasm` MIME type**, the returned promise
> will be rejected with a TypeError;

> [WebAssembly - Additional Web Embedding API](https://webassembly.org/docs/web/#additional-web-embedding-api)

Specifically, if you try and load a WebAssembly blob without the MIME type set, you'll get an error.
On the web, this isn't a huge issue because you actually have a server delivering the blob. With Electron,
you're resolving things with a `file://` URL, and thus can't control the MIME type.

There are a couple of solutions depending on how far into the deep end you care to venture:

- Embedding a static file server in your Electron application
- Using a [custom protocol](https://electronjs.org/docs/api/protocol) and custom protocol handler
- Hosting your WASM blob on a website, thus tying your users to the internet

But all of these are pretty bad solutions and defeat the purpose of using WASM in the first place. Instead,
my workaround was to [open a PR with webpack](https://github.com/webpack/webpack/issues/7918) and
use regex to remove calls to `instantiateStreaming` in the
[build script](https://github.com/bspeice/isomorphic_rust/blob/master/percy/build.sh#L21-L25)

```sh
cargo +nightly build --target=wasm32-unknown-unknown && \
    wasm-bindgen "$WASM_DIR/debug/$WASM_NAME.wasm" --out-dir "$APP_DIR" --no-typescript && \
    # Have to use --mode=development so we can patch out the call to instantiateStreaming
    "$DIR/node_modules/webpack-cli/bin/cli.js" --mode=development "$APP_DIR/app_loader.js" -o "$APP_DIR/bundle.js" && \
    sed -i 's/.*instantiateStreaming.*//g' "$APP_DIR/bundle.js"
```

On a brighter note, once [another Webpack PR](https://github.com/webpack/webpack/pull/7983) lands,
the [build process](https://github.com/bspeice/isomorphic_rust/blob/master/percy_patched_webpack/build.sh#L24-L27)
becomes more straight-forward:

```sh

cargo +nightly build --target=wasm32-unknown-unknown && \
    wasm-bindgen "$WASM_DIR/debug/$WASM_NAME.wasm" --out-dir "$APP_DIR" --no-typescript && \
    "$DIR/node_modules/webpack-cli/bin/cli.js" --mode=production "$APP_DIR/app_loader.js" -o "$APP_DIR/bundle.js"
```

But we're not done yet! After we compile Rust into WASM and link WASM to JS (via `wasm-bindgen` and `webpack`),
we still have to make an Electron app. For this purpose I used an Electron starter app from [Electron Forge],
and then a [`prestart` script](https://github.com/bspeice/isomorphic_rust/blob/master/percy/package.json#L8)
to actually handle the build process.

So the [final toolchain](https://github.com/bspeice/isomorphic_rust/blob/master/percy/package.json#L8)
looks something like this:

- `yarn start` triggers the `prestart` script
- `prestart` checks for missing tooling (`wasm-bindgen-cli`, etc.) and then:
    - Uses `cargo` to compile the Rust code into WASM
    - Uses `wasm-bindgen` to link the WASM blob into a Javascript file with export symbols
    - Uses `webpack` to bundle the page start script with the Javascript we just generated
        - Uses `babel` under the hood to compile the `wasm-bindgen` down from ES6 to something browser-compatible
- The `start` script actually runs an Electron Forge handler to do some sanity checks
- Electron actually starts

...which is complicated. I think more work needs to be done to either build a high-quality starter app that
can manage these steps, or something tool "just handles" the complexity of linking a compiled WASM file into
something the browser can run.

# Issue the Second: WASM tools in Rust

For as much as I didn't enjoy the Javascript tooling needed to interface with Rust, the Rust-only bits aren't
any better at the moment. I get it, a lot of projects are just starting off, and that leads to a fragmented
ecosystem. So here's what I can recommend as a starting point:

There are two projects that are attempting to be actual "frameworks": [percy] and [yew]. Between those,
I got [two](https://github.com/bspeice/isomorphic_rust/tree/master/percy)
[examples](https://github.com/bspeice/isomorphic_rust/tree/master/percy_patched_webpack) running
using `percy`, but was unable to get an [example](https://github.com/bspeice/isomorphic_rust/tree/master/yew)
running with `yew` because of issues with "missing modules":

```sh
ERROR in ./dist/electron_yew_wasm_bg.wasm
Module not found: Error: Can't resolve 'env' in '/home/bspeice/Development/isomorphic_rust/yew/dist'
 @ ./dist/electron_yew_wasm_bg.wasm
 @ ./dist/electron_yew_wasm.js
 @ ./dist/app.js
 @ ./dist/app_loader.js
```

If you want to work with the browser APIs directly, your choices are [percy-webapis] or [stdweb] (or eventual [web-sys]).
See above for my `percy` examples, but when I [tried to use `stdweb`](https://github.com/bspeice/isomorphic_rust/tree/master/stdweb),
I was unable to get it running:

```sh
ERROR in ./dist/stdweb_electron_bg.wasm
Module not found: Error: Can't resolve 'env' in '/home/bspeice/Development/isomorphic_rust/stdweb/dist'
 @ ./dist/stdweb_electron_bg.wasm
 @ ./dist/stdweb_electron.js
 @ ./dist/app_loader.js
```

At this point I'm pretty convinced that `stdweb` is the issue for `yew` as well, but can't prove it.

I did also get a [minimal example](https://github.com/bspeice/isomorphic_rust/tree/master/minimal) running
that doesn't depend on any frameworks, just `wasm-bindgen`. It would require manually writing `extern C`
blocks for everything in the browser though, so I don't recommend it.

Finally, from a frameworks view, there are two up-and-coming packages that should be mentioned:
If you're interested in building something from scratch, [js-sys] and [web-sys] are ones to keep your eyes on.
The idea is to generate all the browser interfaces for you, and leave you to do your thing in peace. I didn't
touch either though, as I'm lazy and wanted to wrap this up.

So there's a lot in play from the Rust side of things, and it's just going to take some time to figure out
what works and what doesn't.

# Issue the Third: Known Unknowns

Alright, so after I managed to get an application started, I stopped there. It was an incredible amount of effort
to chain together everything that was needed, and at this point I'd just rather learn [Typescript] than keep
trying to maintain an incredibly brittle pipeline. Blasphemy, I know...

The important point I want to make is that there's a lot uknown about how any of this would hold up outside
of proofs of concept <span style="font-size:.6em">(proof of concepts? proofs of concepts?)</span>.
Things I didn't attempt:

- Testing
- Packaging
- Updates
- Literally anything related to why I wanted to use Electron in the first place

And even outside Electron, the Rust tools are pretty brittle; if someone manages to install a version of `wasm-bindgen-cli`
different from what's in your `Cargo.lock`, they receive a nasty error:

```
it looks like the Rust project used to create this wasm file was linked against
a different version of wasm-bindgen than this binary:

rust wasm file: 0.2.21
    this binary: 0.2.17

Currently the bindgen format is unstable enough that these two version must
exactly match, so it's required that these two version are kept in sync by
either updating the wasm-bindgen dependency or this binary.
```

# What it Would Take

Much as I don't like Javascript, the foundation is too shaky for me to recommend mixing Electron and WASM
at the moment. There's a lot of innovation happening here, so who knows? Someone might have an application in production
a couple months from now. But at the moment, I'm personally going to stay away.

Let's finish then with a wishlist. Here are the things that I think need to happen before Electron/WASM/Rust
can become a thing:

- Webpack still needs some updates. The necessary work is in progress, but hasn't landed yet ([#7983](https://github.com/webpack/webpack/pull/7983))
- Browser API libraries ([web-sys] and [stdweb]) need to make sure they can support running in Electron (see module error above)
- `wasm-bindgen` is great, but still in the "move fast and break things" phase
- A good "boilerplate" app would dramatically simplify the start costs; [electron-react-boilerplate](https://github.com/chentsulin/electron-react-boilerplate)
  comes to mind
- More blog posts/contributors! I think Electron + Rust could be cool, but I have no idea what I'm doing

[wxwidgets]: https://wxwidgets.org/
[libui-rs]: https://github.com/LeoTindall/libui-rs/
[electron]: https://electronjs.org/
[babel]: https://babeljs.io/
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
[asm.js]: http://asmjs.org/
[emscripten]: https://kripken.github.io/emscripten-site/
[typescript]: https://www.typescriptlang.org/
[electron forge]: https://electronforge.io/
[conrod]: https://github.com/PistonDevelopers/conrod
[webpack]: https://webpack.js.org/