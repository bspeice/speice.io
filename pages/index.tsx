import Layout from "./LayoutPage";

export const Page = () => (
  <>
    <p>Is this thing on?</p>
    <p>
      <a href="/2019/02/the-whole-world">Code</a>
    </p>
  </>
);

export default function () {
  return (
    <Layout>
      <Page />
    </Layout>
  );
}
