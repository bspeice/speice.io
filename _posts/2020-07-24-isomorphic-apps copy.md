---
layout: post
title: "More Isomorphic Desktop Apps with Rust"
description: "They suck less now."
category:
tags: [rust, javascript, webassembly]
---

I wasn't expecting to write this, but it's 2020 and we could all use a win. When last I addressed
using WASM + Electron to write desktop applications in Rust, there were ultimately too many issues
to recommend this combination as feasible. Since then, there's been a lot of progress, and after
finding out [the biggest problem] has been addressed, I decided it was time to take another look at
where things stand.

# Loading local WASM blobs

Previously, the most significant issue was trying to actually load WASM blobs in Electron. This
problem was the result of a combination of factors:

1. When using streaming WASM blobs
   ([`WebAssembly.instantiateStreaming()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiateStreaming)),
   the blob must be returned with a `Content-Type` header of `application/wasm`.
   - If the full WASM blob is loaded into memory first, the MIME type restriction does not apply.
2. When Chrome loads `file://` URLs, the `Content-Type` is unset.
3. Webpack prioritizes streaming WASM whenever available, and if it fails, has no graceful fallback.
4. When building Rust WASM binaries using `wasm-bindgen`, webpack is used to generate JS bindings
   for the WASM blob.

Putting all this together:

- Electron loads the JS created by `wasm-bindgen`/webpack
- This JS file calls attempts to load the WASM blob, which just so happens to be located on disk
- Because the MIME type isn't set, loading fails

This was a well-known issue;
[emscripten](https://github.com/emscripten-core/emscripten/blob/8914c5cd5e4ac35a806430e8c77c88cd8c65b234/src/preamble.js#L2295)
even included a graceful fallback for this scneario. It was possible to tweak the JS created by
`wasm-bindgen` to load WASM, but using `sed` to edit generated code will eventually lead to madness.

I'm unable to figure out when exactly it changed, but requesting WASM blobs from `file://` URLs in
Chrome now sets the MIME type, and thus the blob is loaded correctly. Additionally, recent changes
to be released in Webpack 5 (specifically the `asyncWebAssembly` and `importAsync`
[experiments](https://webpack.js.org/configuration/experiments/)) enable loading WASM without a
separate launcher script.

# The evolution of Rust

Rust as a language has also made a great deal of progress since late 2018. Previously, some
widely-used crates (like `stdweb`) required a `nightly` Rust compiler to function. Now, nearly
everything compiles on `stable`. In addition, now that Rust supports `async/await`, it's much easier
to interact with Javascript. It's still necessary to use some crates like `wasm_bindgen` to assist
the interaction, but Rust can now make use of the same asynchronous paradigms that have proven to be
incredibly effective in Javascript.

There's also been great progress on some crates to interact directly with the browser; `web-sys` and
`js-sys` enable easier interoperation with the browser, where previously users didn't have these
options available.

The tooling and documentation has improved as well. `wasm-pack` has proven itself as a reliable "one
stop shop" tool for managing WASM projects. While using `wasm-bindgen` and `webpack` directly are
still necessary for building Electron apps (due to Webpack v5 not yet released), this should change
in the near future as well.

# New examples

(need to put some screenshots and link to the new examples here)

# Outstanding issues

While I haven't been directly involved in any of the progress made to improve Rust + WASM, it's
incredibly encouraging to see just how far everything has come. Seeing where the ecosystem stands
now, I think using Electron + Rust to build desktop applications is _feasible_. Not necessarily a
_good_ idea, not that it offers any specific benefit over using Javascript/Typescript, just that
it's now _feasible_.

Looking forward, the things I think could be beneficial to address are:

- Template/starter project examples
  - Being able to `yarn create` a project and have it already set up with two-way JS to Rust
    bindings would go a long way towards reducing the currently painful setup using either
    `wasm-bindgen` or `wasm-pack`.
- Comparisons to Typescript and Neon
  - Is there a development or performance benefit that comes from using Rust instead of Typescript?
    Took some time to learn Typescript since the last post, and while it's possible that WASM might
    execute faster, I'm not sure that Rust offers enough of a benefit to justify the significantly
    more complex setup. It would be useful to port an existing (small) application to Rust so that
    other developers can see a representative example of each and make a decision for themselves.
  - Instead of embedding Rust in Electron by way of WASM, [Neon] can be used to develop extensions
    that run natively and are "glued" to Electron via Javascript. Further investigation to clarify
    the pros/cons of each approach would be helpful; are there situations in which WASM offers
    benefits over Neon? Vice-versa? Both WASM and Neon already require more complex setups than
    typical JS/TS setups.
