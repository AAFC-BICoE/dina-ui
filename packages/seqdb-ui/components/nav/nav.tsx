import { intlContext, LanguageSelector } from "common-ui";
import Link from "next/link";
import React, { useContext } from "react";
import { SeqdbMessage } from "../../intl/seqdb-intl";

export function Nav() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
      <style>{`
        body {
          /* Add padding to the body so content is not hidden. */
          padding-top: 80px;
        }
      `}</style>
      <div className="container-fluid p-0">
        <Link href="/">
          <a
            className="navbar-brand"
            style={{ color: "#1465b7", fontWeight: "bold" }}
          >
            <SeqdbMessage id="appTitle" />
          </a>
        </Link>
        <div className="nav navbar-nav float-right">
          <LanguageSelector />
        </div>
      </div>
    </nav>
  );
}
