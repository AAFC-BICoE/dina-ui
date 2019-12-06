import Link from "next/link";
import React, { Fragment } from "react";
import { SeqdbMessage, useSeqdbIntl } from "../../intl/seqdb-intl";
import "./nav.css";

const LANGUAGE_LABELS = {
  en: "English",
  fr: "Français"
};

export function Nav() {
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
          <LanguageSelector />
        </div>
      </div>
    </nav>
  );
}

function LanguageSelector() {
  const { locale, setLocale } = useSeqdbIntl();

  if (!process.browser) {
    return null;
  }

  return (
    <>
      {Object.keys(LANGUAGE_LABELS).map((key, i, arr) => {
        const divider = i < arr.length - 1 && " | ";

        function onClick() {
          setLocale(key);
        }

        return (
          <Fragment key={key}>
            <button
              className="btn btn-link"
              disabled={locale === key}
              onClick={onClick}
            >
              {LANGUAGE_LABELS[key]}
            </button>
            <div style={{ paddingTop: "0.375rem" }}>{divider}</div>
          </Fragment>
        );
      })}
    </>
  );
}
