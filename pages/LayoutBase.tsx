import { PropsWithChildren, StrictMode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faUser } from "@fortawesome/free-solid-svg-icons";

import "./style.css";

const Navbar: React.FC = () => (
  <span className="navbar">
    <a href="/">
      <FontAwesomeIcon icon={faHome} className="icon" />
      Home
    </a>
    <span>/</span>
    <a href="/about">
      <FontAwesomeIcon icon={faUser} className="icon" />
      About
    </a>
  </span>
);

const Layout: React.FC<PropsWithChildren> = ({ children }) => (
  <StrictMode>
    <div className="gridOffset">
      <Navbar />
      <hr style={{ marginTop: "0" }} />
      {children}
    </div>
  </StrictMode>
);

export default Layout;
