import Link from "next/link";
import React from "react";
import "./nav.css";

export function Nav() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
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
}
