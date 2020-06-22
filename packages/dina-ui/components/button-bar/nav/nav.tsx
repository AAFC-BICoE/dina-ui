import { LanguageSelector, useAccount } from "common-ui";
import Link from "next/link";
import React from "react";
import { DinaMessage } from "../../../intl/dina-ui-intl";

export function Nav() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
      <div className="container-fluid p-0">
        <Link href="/">
          <a
            className="navbar-brand"
            style={{ color: "#1465b7", fontWeight: "bold" }}
          >
            <DinaMessage id="appTitle" />
          </a>
        </Link>
        <ul className="navbar-nav ml-auto">
          <li className="nav-item mx-2">
            <LanguageSelector />
          </li>
          <li className="nav-item mx-2">
            <NavbarUserControl />
          </li>
        </ul>
      </div>
    </nav>
  );
}

/** Shows the logged-in user and the logout button. */
function NavbarUserControl() {
  const { authenticated, initialized, logout, username } = useAccount();

  return (
    <div className="d-flex">
      {initialized && authenticated ? (
        <>
          {username && (
            <span className="mr-2 my-auto">
              <DinaMessage id="loggedInAsUser" values={{ name: username }} />
            </span>
          )}
          <button
            type="button"
            className="btn btn-dark logout-button"
            onClick={() => logout()}
          >
            <DinaMessage id="logoutBtn" />
          </button>
        </>
      ) : null}
    </div>
  );
}
