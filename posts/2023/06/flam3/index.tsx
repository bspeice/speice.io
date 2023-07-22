import Blog from "../../../LayoutBlog";
import { CanvasColor } from "./0-canvas.js";

export default function () {
  const Layout = Blog({
    title: "The fractal flame algorithm",
    description: "Explaining the paper",
    published: "2023-06-25",
  });
  return (
    <Layout>
      <CanvasColor />
    </Layout>
  );
}
