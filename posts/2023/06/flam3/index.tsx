import React from "react";
import Blog from "../../../LayoutBlog";

import { Canvas } from "./0-utility";
import { gasket } from "./1-gasket";
import { renderBaseline } from "./2-variations";

export default function () {
  const Layout = Blog({
    title: "The fractal flame algorithm",
    description: "Explaining the paper",
    published: "2023-06-25",
  });
  return (
    <Layout>
      <Canvas f={gasket} />
      <Canvas f={renderBaseline} />
    </Layout>
  );
}
