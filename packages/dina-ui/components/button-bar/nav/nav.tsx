import { LanguageSelector, useAccount } from "common-ui";
import Link from "next/link";
import React from "react";
import { DinaMessage } from "../../../intl/dina-ui-intl";

export function Nav() {
  return (
    <header>
      <div id="wb-bnr" className="container">
        <div className="row d-flex">
          <div
            className="brand col-5 col-md-4"
            property="publisher"
            typeof="GovernmentOrganization"
          >
            <img
              src="https://www.canada.ca/etc/designs/canada/cdts/gcweb/v4_0_32/assets/sig-blk-en.svg"
              alt=""
              property="logo"
            />
            <span className="wb-inv" property="name">
              <DinaMessage id="governmentOfCanada" />
            </span>
            <meta property="areaServed" typeof="Country" content="Canada" />
          </div>
          <section id="wb-lng" className="text-right ml-auto">
            <ul className="list-inline ">
              <li className="list-inline-item mx-2">
                <LanguageSelector />
              </li>
              <li className="list-inline-item mx-2">
                <NavbarUserControl />
              </li>
              <li className="list-inline-item mx-2 my-auto">
                <a
                  className="btn btn-info"
                  href="https://github.com/AAFC-BICoE/dina-planning/issues/new?labels=demo%20feedback"
                >
                  <DinaMessage id="feedbackButtonText" />
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
      <div className="app-bar">
        <div className="container">
          <div className="row">
            <section className="col-12">
              <Link href="/">
                <a className="app-name">
                  <DinaMessage id="appTitle" />
                </a>
              </Link>
            </section>
          </div>
        </div>
      </div>
    </header>
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
