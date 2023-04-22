import { PropsWithChildren } from "react";

import "./style.css";

const Navbar: React.FC = () => (
  <span className="navbar">
    <a href="/">Home</a>/<a href="/about">About</a>
  </span>
);

const Layout: React.FC<PropsWithChildren> = ({ children }) => (
  <div className="gridOffset">
    <Navbar />
    <hr />
    {children}
  </div>
);

export default Layout;
