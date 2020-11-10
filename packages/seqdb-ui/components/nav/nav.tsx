import { LanguageSelector, NavbarUserControl } from "common-ui";
import Link from "next/link";
import React from "react";
import { SeqdbMessage } from "../../intl/seqdb-intl";

export function Nav() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
      <style>{`
        body {
          /* Add padding to the body so content is not hidden. */
          padding-top: 80px;
        }

        .dropdown:hover .dropdown-menu {
          display: block;
        }
        .dropdown a.nav-link {
          color: rgb(232, 230, 227);
        }
      `}</style>
      <div className="container-fluid p-0">
        <NavSeqDBDropdown />
        <ul className="list-inline d-flex m-0">
          <li className="list-inline-item mx-2">
            <LanguageSelector />
          </li>
          <li className="list-inline-item mx-2">
            <NavbarUserControl />
          </li>
        </ul>
      </div>
    </nav>
  );
}

function NavSeqDBDropdown() {
  return (
    <div className="dropdown">
      <Link href="/">
        <a
          className="navbar-brand nav-link dropdown-toggle"
          style={{ color: "#1465b7", fontWeight: "bold" }}
        >
          <SeqdbMessage id="appTitle" />
        </a>
      </Link>
      <div className="dropdown-menu m-0">
        <Link href="/workflow/list">
          <a className="dropdown-item">
            <SeqdbMessage id="workflowListTitle" />
          </a>
        </Link>
        <Link href="/index-set/list">
          <a className="dropdown-item">
            <SeqdbMessage id="indexSetListTitle" />
          </a>
        </Link>
        <Link href="/pcr-primer/list">
          <a className="dropdown-item">
            <SeqdbMessage id="pcrPrimerListTitle" />
          </a>
        </Link>
        <Link href="/pcr-profile/list">
          <a className="dropdown-item">
            <SeqdbMessage id="pcrProfileListTitle" />
          </a>
        </Link>
        <Link href="/product/list">
          <a className="dropdown-item">
            <SeqdbMessage id="productListTitle" />
          </a>
        </Link>
        <Link href="/protocol/list">
          <a className="dropdown-item">
            <SeqdbMessage id="protocolListTitle" />
          </a>
        </Link>
        <Link href="/region/list">
          <a className="dropdown-item">
            <SeqdbMessage id="regionListTitle" />
          </a>
        </Link>
      </div>
    </div>
  );
}
