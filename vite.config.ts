import { defineConfig } from "vite";
import blog from "@bspeice/vite-plugin-blog";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react-swc";
import rehypeHighlight from "rehype-highlight";

import { Root, Element } from "hast";
import { Plugin } from "unified";
import { visit } from "unist-util-visit";

// Add the `hljs` class to `pre` so it picks up the highlight background color
const highlightPre: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, (node, _, parent) => {
      if (
        !parent ||
        (parent as Element).tagName !== "pre" ||
        (node as Element).tagName !== "code"
      ) {
        return;
      }

      const parentElement = parent as Element;
      const parentProperties = parentElement.properties;

      if (!parentProperties) {
        return;
      }

      if (!Array.isArray(parentProperties["className"])) {
        parentProperties["className"] = ["hljs"];
      } else {
        parentProperties["className"].unshift("hljs");
      }
    });
  };
};

export default defineConfig({
  plugins: [
    blog({
      "/": "/pages/index.tsx",
      "/about": "/pages/about.mdx",
      "/2019/02/the-whole-world": "/posts/2019/02/the-whole-world.mdx",
    }),
    mdx({ rehypePlugins: [rehypeHighlight, highlightPre] }),
    react(),
  ],
});
