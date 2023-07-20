import { build } from "vite";
import Blog from "../../../LayoutBlog";

import { CanvasRenderer } from "./0-canvas";
import { buildBaseline } from "./2a-variations";
import { buildPost } from "./2b-post";
import { buildFinal } from "./2c-final";
import { buildBinary } from "./3a-binary";
import { buildColor } from "./4-color";
import { buildLinear } from "./3b-linear";
import { buildLogarithmic } from "./3c-logarithmic";
import { buildSolo1, buildSolo2, buildSolo3 } from "./5b-solo";
import { buildGasketFlame } from "./5a-gasket";

export default function () {
  const Layout = Blog({
    title: "The fractal flame algorithm",
    description: "Explaining the paper",
    published: "2023-06-25",
  });
  return (
    <Layout>
      {/* <CanvasRenderer
        params={{
          defaultUrl: "",
          size: 400,
          renderer: new RendererGasket(400),
          qualityMax: 0.3,
          qualityStep: 0.1,
        }}
      /> */}
      {/* <CanvasRenderer
        params={{
          defaultUrl: "",
          size: 400,
          renderer: (size) => buildBaseline(size),
          qualityMax: 1,
          qualityStep: 0.1,
        }}
      /> */}
      {/* <CanvasRenderer
        params={{
          defaultUrl: "",
          size: 400,
          renderer: (size) => buildPost(size),
          qualityMax: 1,
          qualityStep: 0.1
        }} /> */}
      {/* <CanvasRenderer
        params={{
          defaultUrl: "",
          size: 400,
          renderer: (size) => buildFinal(size),
          qualityMax: 1,
          qualityStep: 0.1,
        }} /> */}
      {/* <CanvasRenderer
        params={{
          defaultUrl: "",
          size: 400,
          renderer: (size) => buildBinary(size),
          qualityMax: 1,
          qualityStep: 0.1,
        }} /> */}
      {/* <CanvasRenderer
        params={{
          defaultUrl: "",
          size: 400,
          renderer: (size) => buildLinear(size),
          qualityMax: 5,
          qualityStep: 0.1,
        }} /> */}
      {/* <CanvasRenderer
        params={{
          defaultUrl: "",
          size: 400,
          renderer: (size) => buildLogarithmic(size),
          qualityMax: 5,
          qualityStep: 0.1,
        }} /> */}
      {/* <CanvasRenderer
        params={{
          defaultUrl: "",
          size: 400,
          renderer: (size) => buildColor(size),
          qualityMax: 50,
          qualityStep: 0.1,
        }} /> */}
      {/* <CanvasRenderer
        params={{
          defaultUrl: "",
          size: 400,
          renderer: (size) => buildSolo1(size),
          qualityMax: 5,
          qualityStep: 0.1,
        }} /> */}
      {/* <CanvasRenderer
        params={{
          defaultUrl: "",
          size: 400,
          renderer: (size) => buildSolo2(size),
          qualityMax: 5,
          qualityStep: 0.1,
        }} /> */}
      {/* <CanvasRenderer
        params={{
          defaultUrl: "",
          size: 400,
          renderer: (size) => buildSolo3(size),
          qualityMax: 5,
          qualityStep: 0.1,
        }} /> */}
      <CanvasRenderer
        params={{
          defaultUrl: "",
          size: 400,
          renderer: (size) => buildGasketFlame(size),
          qualityMax: 0.3,
          qualityStep: 0.1,
        }}
      />
    </Layout>
  );
}
