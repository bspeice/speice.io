import { PropsWithChildren, StrictMode } from "react";

import "./style.css";
import Navbar from "./Navbar";

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
