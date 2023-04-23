import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import { MDXProvider } from "@mdx-js/react";
import React, { PropsWithChildren } from "react";

import Base from "../pages/LayoutBase";

interface BlogProps {
  title: string;
  description: string;
  published: string;
  updated?: string;
}

const components = {
  pre: (props: any) => <pre className="hljs" {...props} />,
};

export default function Layout({
  title,
  description,
  published,
  updated,
}: BlogProps): React.FC<PropsWithChildren> {
  const header = (
    <div className="header">
      <h1>{title}</h1>
      <h3>{description}</h3>
      <h4>
        <FontAwesomeIcon
          icon={faCalendar}
          scale={1.2}
          className="icon icon-post"
        />
        {published}
      </h4>
      {updated && <p>Last updated: {updated}</p>}
    </div>
  );

  const withChildren: React.FC<PropsWithChildren> = ({ children }) => (
    <Base>
      {header}
      <div style={{ paddingTop: "2em" }} />
      <MDXProvider components={components}>{children}</MDXProvider>
    </Base>
  );
  return withChildren;
}
