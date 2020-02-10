import { intlContext, LanguageSelector } from "common-ui";
import Link from "next/link";
import React, { useContext } from "react";
import { ObjectStoreMessage } from "../../../intl/objectstore-intl";
import "./nav.css";

export function Nav() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top wb-inv">
      <div className="container-fluid p-0">
        <Link href="/">
          <a
            className="navbar-brand"
            style={{ color: "#1465b7", fontWeight: "bold" }}
          >
            <ObjectStoreMessage id="appTitle" />
          </a>
        </Link>
        <div className="nav navbar-nav float-right">
          <LanguageSelector />
        </div>
      </div>
    </nav>
  );
}
