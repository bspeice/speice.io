import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faUser } from "@fortawesome/free-solid-svg-icons";

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

export default Navbar;
