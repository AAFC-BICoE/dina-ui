import Link from "next/link";
import React from "react";

const Nav: React.FunctionComponent = () => (
  <nav className="navbar navbar-expand-lg navbar-light bg-light">
    <Link prefetch={true} href="/">
      <a
        className="navbar-brand"
        style={{ color: "#1465b7", fontWeight: "bold" }}
      >
        Sequence Database
      </a>
    </Link>
  </nav>
);

export default Nav;
