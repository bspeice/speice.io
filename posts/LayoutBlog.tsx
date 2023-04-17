import { PropsWithChildren } from "react";

import Base from "../pages/LayoutBase";

interface BlogProps {
  title: string;
  description: string;
  published: string;
  updated?: string;
}

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
      <p>Published: {published}</p>
      {updated && <p>Last updated: {updated}</p>}
    </div>
  );

  const withChildren: React.FC<PropsWithChildren> = ({ children }) => (
    <Base>
      {header}
      <hr />
      {children}
    </Base>
  );
  return withChildren;
}
