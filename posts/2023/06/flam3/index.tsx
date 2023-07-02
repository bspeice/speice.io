import Blog from "../../../LayoutBlog";

import { Canvas } from "./0-utility";
import { gasket } from "./1-gasket";
import { renderBaseline } from "./2a-variations";
import { renderPost } from "./2b-post";
import { renderFinal } from "./2c-final";

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
    </Layout>
  );
}
