import Link from "next/link";
import React from "react";
import { i18n } from '../i18n'

export class Nav extends React.Component {
  render() {
    return (
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <Link prefetch={true} href="/">
          <a
            className="navbar-brand"
            style={{ color: "#1465b7", fontWeight: "bold" }}
          >
            Sequence Database
          </a>
        </Link>
        <div>
          <button
            type='button'
            onClick={() => i18n.changeLanguage('en')}
          >
            English
          </button>

          <button
            type='button'
            onClick={() => i18n.changeLanguage('fr')}
          >
            French
          </button>
        </div>
      </nav>
    );
  }
}

