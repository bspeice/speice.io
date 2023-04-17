import { PropsWithChildren } from "react";

import "./style.css";

const Sidebar: React.FC = () => (
  <span className={"navbar"}>
    <a href="/">Home</a>/<a href="/about">About</a>
  </span>
);

const Layout: React.FC<PropsWithChildren> = ({ children }) => (
  <div className="gridOffset">
    <div className="gridOffsetSide">
      <Sidebar />
    </div>
    {children}
  </div>
);

export default Layout;
