import { PropsWithChildren, StrictMode } from "react";
import { IconContext } from "react-icons";
import { FaHome, FaUser } from "react-icons/fa";

import "./style.css";

const Navbar: React.FC = () => (
  <span className="navbar">
    <a href="/">
      <FaHome />
      Home
    </a>
    <span>/</span>
    <a href="/about">
      <FaUser />
      About
    </a>
  </span>
);

const Layout: React.FC<PropsWithChildren> = ({ children }) => (
  <StrictMode>
    <IconContext.Provider value={{ className: "icon" }}>
      <div className="gridOffset">
        <Navbar />
        <hr style={{ marginTop: "0" }} />
        {children}
      </div>
    </IconContext.Provider>
  </StrictMode>
);

export default Layout;
