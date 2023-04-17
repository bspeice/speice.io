import { defineConfig } from "vite";
import blog from "@bspeice/vite-plugin-blog";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react-swc";

import remarkPrism from "remark-prism";

export default defineConfig({
  plugins: [
    blog({
      "/": "/pages/index.tsx",
      "/about": "/pages/about.mdx",
      "/2019/02/the-whole-world": "/posts/2019/02/the-whole-world.mdx",
    }),
    mdx({ remarkPlugins: [remarkPrism] }),
    react(),
  ],
});
