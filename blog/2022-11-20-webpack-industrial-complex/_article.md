---
layout: post
title: "The webpack industrial complex"
description: "Reflections on a new project"
category:
tags: [webpack, react, vite]
---

This started because I wanted to build a synthesizer. Setting a goal of "digital DX7" was ambitious, but I needed something unrelated to the day job. Beyond that, working with audio seemed like a good challenge. I enjoy performance-focused code, and performance problems in audio are conspicuous. Building a web project was an obvious choice because of the web audio API documentation and independence from a large Digital Audio Workstation (DAW).

The project was soon derailed trying to sort out technical issues unrelated to the original purpose. Finding a resolution was a frustrating journey, and it's still not clear whether those problems were my fault. As a result, I'm writing this to try making sense of it, as a case study/reference material, and to salvage something from the process.

## Starting strong

The sole starting requirement was to write everything in TypeScript. Not because of project scale, but because guardrails help with unfamiliar territory. Keeping that in mind, the first question was: how does one start a new project? All I actually need is "compile TypeScript, show it in a browser."

Create React App (CRA) came to the rescue and the rest of that evening was a joy. My TypeScript/JavaScript skills were rusty, but the online documentation was helpful. I had never understood the appeal of JSX (why put a DOM in JavaScript?) until it made connecting an `onEvent` handler and a function easy.

Some quick dimensional analysis later and there was a sine wave oscillator playing A=440 through the speakers. I specifically remember thinking "modern browsers are magical."

## Continuing on

Now comes the first mistake: I began to worry about "scale" before encountering an actual problem. Rather than rendering audio in the main thread, why not use audio worklets and render in a background thread instead?

The first sign something was amiss came from the TypeScript compiler errors showing the audio worklet API [was missing](https://github.com/microsoft/TypeScript/issues/28308). After searching out Github issues and (unsuccessfully) tweaking the `.tsconfig` settings, I settled on installing a package and moving on.

The next problem came from actually using the API. Worklets must load from separate "modules," but it wasn't clear how to guarantee the worklet code stayed separate from the application. I saw recommendations to use `new URL(<local path>, import.meta.url)` and it worked! Well, kind of:

![Browser error](/assets/images/2022-11-20-video_mp2t.png)

That file has the audio processor code, so why does it get served with `Content-Type: video/mp2t`?

## Floundering about

Now comes the second mistake: even though I didn't understand the error, I ignored recommendations to [just use JavaScript](https://hackernoon.com/implementing-audioworklets-with-react-8a80a470474) and stuck by the original TypeScript requirement.

I tried different project structures. Moving the worklet code to a new folder didn't help, nor did setting up a monorepo and placing it in a new package.

I tried three different CRA tools - `react-app-rewired`, `craco`, `customize-react-app` - but got the same problem. Each has varying levels of compatibility with recent CRA versions, so it wasn't clear if I had the right solution but implemented it incorrectly. After attempting to eject the application and panicking after seeing the configuration, I abandoned that as well.

I tried changing the webpack configuration: using [new](https://github.com/webpack/webpack/issues/11543#issuecomment-917673256) [loaders](https://github.com/popelenkow/worker-url), setting [asset rules](https://github.com/webpack/webpack/discussions/14093#discussioncomment-1257149), even [changing how webpack detects worker resources](https://github.com/webpack/webpack/issues/11543#issuecomment-826897590). In hindsight, entry points may have been the answer. But because CRA actively resists attempts to change its webpack configuration, and I couldn't find audio worklet examples in any other framework, I gave up.

I tried so many application frameworks. Next.js looked like a good candidate, but added its own [bespoke webpack complexity](https://github.com/vercel/next.js/issues/24907) to the existing confusion. Astro had the best "getting started" experience, but I refuse to install an IDE-specific plugin. I first used Deno while exploring Lume, but it couldn't import the audio worklet types (maybe because of module compatibility?). Each framework was unique in its own way (shout-out to SvelteKit) but I couldn't figure out how to make them work.

## Learning and reflecting

I ended up using Vite and vite-plugin-react-pages to handle both "build the app" and "bundle worklets," but the specific tool choice isn't important. Instead, the focus should be on lessons learned.

For myself:

- I'm obsessed with tooling, to the point it can derail the original goal. While it comes from a good place (for example: "types are awesome"), it can get in the way of more important work
- I tend to reach for online resources right after seeing a new problem. While finding help online is often faster, spending time understanding the problem would have been more productive than cycling through (often outdated) blog posts

For the tools:

- Resource bundling is great and solves a genuine challenge. I've heard too many horror stories of developers writing modules by hand to believe this is unnecessary complexity
- Webpack is a build system and modern frameworks are deeply dependent on it (hence the "webpack industrial complex"). While this often saves users from unnecessary complexity, there's no path forward if something breaks
- There's little ability to mix and match tools across frameworks. Next.js and Gatsby let users extend webpack, but because each framework adds its own modules, changes aren't portable. After spending a week looking at webpack, I had an example running with parcel in thirty minutes, but couldn't integrate it

In the end, learning new systems is fun, but a focus on tools that "just work" can leave users out in the cold if they break down.