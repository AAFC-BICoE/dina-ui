import { LanguageSelector, useAccount } from "common-ui";
import Link from "next/link";
import React from "react";
import { ObjectStoreMessage } from "../../../intl/objectstore-intl";
import "./nav.css";

export function Nav() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
      <div className="container-fluid p-0">
        <Link href="/">
          <a
            className="navbar-brand"
            style={{ color: "#1465b7", fontWeight: "bold" }}
          >
            <ObjectStoreMessage id="appTitle" />
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
              <ObjectStoreMessage
                id="loggedInAsUser"
                values={{ name: username }}
              />
            </span>
          )}
          <button
            type="button"
            className="btn btn-dark logout-button"
            onClick={() => logout()}
          >
            <ObjectStoreMessage id="logoutBtn" />
          </button>
        </>
      ) : null}
    </div>
  );
}
