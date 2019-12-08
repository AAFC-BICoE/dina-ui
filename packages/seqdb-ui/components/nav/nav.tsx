import { LanguageSelector } from "common-ui";
import Link from "next/link";
import React from "react";
import { SeqdbMessage, useSeqdbIntl } from "../../intl/seqdb-intl";
import "./nav.css";

export function Nav() {
  const { locale, setLocale } = useSeqdbIntl();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
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
          <LanguageSelector locale={locale} onLocaleChange={setLocale} />
        </div>
      </div>
    </nav>
  );
}
