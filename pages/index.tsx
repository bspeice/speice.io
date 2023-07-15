import Layout from "./LayoutPage";

export const Page = () => (
  <>
    <p>Is this thing on?</p>
    <p>
      <a href="/2023/06/flam3">Code</a>
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
