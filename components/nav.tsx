import React from "react";
import { i18n, Trans, Link } from '../i18n'

export class Nav extends React.Component {
  render() {
    return (
      <nav className="navbar-expand-lg navbar-light bg-light">
        <Link prefetch={true} href="/">
          <a
            className="navbar-brand"
            style={{ color: "#1465b7", fontWeight: "bold" }}
          >
            <Trans i18nKey='Sequence Database' />
          </a>
        </Link>
        <div style={{ float: 'right' }}>
          <a href="" onClick={() => i18n.changeLanguage('en')} >English |</a>
          <a href="" onClick={() => i18n.changeLanguage('fr')} > French </a>
        </div>
      </nav >
    );
  }
}

