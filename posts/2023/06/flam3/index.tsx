import Blog from "../../../LayoutBlog";

import { Canvas } from "./0-canvas";
import { gasket } from "./1-gasket";
import { renderBaseline } from "./2a-variations";
import { renderPost } from "./2b-post";
import { renderFinal } from "./2c-final";
import { renderBinary } from "./3a-binary";
import { renderLinear } from "./3b-linear";
import { renderLogarithmic } from "./3c-logarithmic";
import {
  renderTransform1,
  renderTransform2,
  renderTransform3,
} from "./4a-solo";
import { renderColor } from "./4b-color";

export default function () {
  const Layout = Blog({
    title: "The fractal flame algorithm",
    description: "Explaining the paper",
    published: "2023-06-25",
  });
  return (
    <Layout>
      <div>
        <Canvas f={gasket} />
        <Canvas f={renderBaseline} />
      </div>
      <div>
        <Canvas f={renderPost} />
        <Canvas f={renderFinal} />
      </div>
      <div>
        <Canvas f={renderLogarithmic} />
        <Canvas f={renderColor} />
      </div>
    </Layout>
  );
}
