import { defineConfig } from "vite";
import blog from "@bspeice/vite-plugin-blog";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react-swc";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkFrontmatter from "remark-frontmatter";
import remarkMath from "remark-math";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";

export default defineConfig({
  build: {
    rollupOptions: {
      external: ["react-icons"],
    },
  },
  plugins: [
    blog({
      "/": "/pages/index.tsx",
      "/about": "/pages/about.mdx",
      "/2019/02/the-whole-world": "/posts/2019/02/the-whole-world.mdx",
    }),
    mdx({
      remarkPlugins: [remarkFrontmatter, remarkMath, remarkMdxFrontmatter],
      rehypePlugins: [rehypeHighlight, rehypeKatex],
      providerImportSource: "@mdx-js/react",
    }),
    react(),
  ],
});
