import { Link } from "react-router-dom";

function Nav() {
  return (
    <div className="nav">
      <Link to="/" className="nav-title">
        Workflow Wizard
      </Link>
    </div>
  );
}

export default Nav;
