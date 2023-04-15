import { defineConfig } from "vite";
import blog from "@bspeice/vite-plugin-blog";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [
    blog({
      "/": "/pages/index",
    }),
    mdx(),
    react(),
  ],
});
