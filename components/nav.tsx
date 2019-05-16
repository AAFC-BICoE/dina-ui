import React from "react";
import { i18n, Trans, Link } from '../i18n'

export class Nav extends React.Component {
  render() {
    return (
      <nav className="navbar-expand-lg navbar-light bg-light navbar navbar-default">
        <div className="navbar-header">
          <Link prefetch={true} href="/">
            <a
              className="navbar-brand"
              style={{ color: "#1465b7", fontWeight: "bold" }}
            >
              <Trans i18nKey='Sequence Database' />
            </a>
          </Link>
        </div>

        <div className="col-md-10 offset-md-10">
          <a id="en" href="" onClick={() => i18n.changeLanguage('en')} >English |</a>
          <a id="fr" href="" onClick={() => i18n.changeLanguage('fr')} > French </a>
        </div>
      </nav >
    );
  }
}

