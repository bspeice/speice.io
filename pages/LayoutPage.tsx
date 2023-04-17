import { PropsWithChildren } from "react";

import Base from "./LayoutBase";

const Layout: React.FC<PropsWithChildren> = ({ children }) => (
  <Base>
    <h1>The Old Speice Guy</h1>
    {children}
  </Base>
);

export default Layout;
