import {
  LanguageSelector,
  NavbarUserControl,
  useAccount
} from "common-ui";
import Link from "next/link";
import React from "react";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { useContext, useState } from "react";
import { intlContext } from "../../../../common-ui/lib/intl/IntlSupport";
import Dropdown from "react-bootstrap/Dropdown";

export interface NavProps {
  id?: string;
  pathname?: string;
}


export function Nav({ id, pathname }) {
  const { isAdmin, rolesPerGroup } = useAccount();
  const { formatMessage } = useDinaIntl();
  const { locale } = useContext(intlContext);

  // Editable if current user is dina-admin, or a collection manager of any group:
  const showUserNav =
    Object.values(rolesPerGroup ?? {})
      ?.flatMap(it => it)
      ?.includes("collection-manager") || isAdmin;

  let shouldOpenInNewTab = getOpenInNewTabForLink({ id, pathname });

  return (
    <>
      <div id="wb-tphp" className="d-flex flex-column align-items-center">
        <a className="wb-link-inv wb-sl" href="#wb-cont">
          <DinaMessage id="skipToMainContent" />
        </a>
        <a className="wb-link-inv wb-sl" href="#wb-info">
          <DinaMessage id="skipToAboutThisApplication" />
        </a>
        <a className="wb-link-inv wb-sl" rel="alternate" href="?wbdisable=true">
          <DinaMessage id="skipToBasicHtmlVersion" />
        </a>
      </div>

      <header className="py-3">
        <div id="wb-bnr" className="container">
          <div className="row d-flex">
            <div
              className="brand col-5 col-md-4"
              property="publisher"
              typeof="GovernmentOrganization"
            >
              <img
                src="https://www.canada.ca/etc/designs/canada/cdts/gcweb/v4_0_32/assets/sig-blk-en.svg"
                alt={formatMessage("governmentOfCanada")}
                property="logo"
              />
              <span className="wb-inv" property="name">
                <span lang={locale}>
                  <DinaMessage id="governmentOfCanada" />
                </span>
              </span>
              <meta property="areaServed" typeof="Country" content="Canada" />
            </div>
            <section id="wb-lng" className="text-end ms-auto col-7 col-md-8">
              <ul className="list-inline">
                <li className="list-inline-item mx-2">
                  <NavbarUserControl />
                </li>
                <li className="list-inline-item mx-2 my-auto">
                  <a
                    className="btn btn-info"
                    href="https://github.com/AAFC-BICoE/dina-planning/issues/new?labels=demo%20feedback"
                    target="_blank"
                  >
                    <DinaMessage id="feedbackButtonText" />
                  </a>
                </li>
                <li className="list-inline-item mx-2">
                  <LanguageSelector />
                </li>
              </ul>
            </section>
          </div>
        </div>
        <div className="app-bar">
          <div className="container">
            <ul className="list-inline d-flex m-0">
              <li className="list-inline-item me-4">
                <Link href="/">
                  <a className="app-name px-0">
                    <DinaMessage id="appTitle" />
                  </a>
                </Link>
              </li>
              <li className="list-inline-item my-auto">
                <NavObjectStoreDropdown
                  shouldOpenInNewTab={shouldOpenInNewTab}
                />
              </li>
              <li className="list-inline-item my-auto">
                <NavAgentsDropdown shouldOpenInNewTab={shouldOpenInNewTab} />
              </li>
              <li className="list-inline-item my-auto">
                <NavSeqDBDropdown shouldOpenInNewTab={shouldOpenInNewTab} />
              </li>
              <li className="list-inline-item my-auto">
                <NavCollectionDropdown
                  shouldOpenInNewTab={shouldOpenInNewTab}
                />
              </li>
              {showUserNav && (
                <li className="list-inline-item my-auto">
                  <NavDinaUserDropdown
                    shouldOpenInNewTab={shouldOpenInNewTab}
                  />
                </li>
              )}
            </ul>
          </div>
        </div>
      </header>
    </>
  );
}

function getOpenInNewTabForLink({ id, pathname }) {
  let openInNewTab = false;
  if (id && pathname?.lastIndexOf("edit") >= 0) {
    openInNewTab = true;
  }
  return openInNewTab;
}

function menuDisplayControl() {
  const [show, setShow] = useState(false);
  const showDropdown = () => {
    setShow(true);
  };
  const hideDropdown = () => {
    setShow(false);
  };
  function onKeyDown(e) {
    if (
      e.key === "ArrowDown" ||
      e.key === "ArrowUp" ||
      e.key === "Space" ||
      e.key === " " ||
      e.key === "Enter"
    ) {
      showDropdown();
    } else if (e.key === "Escape" || (e.shiftKey && e.key === "Tab")) {
      hideDropdown();
    }
  }
  function onKeyDownLastItem(e) {
    if (!e.shiftKey && e.key === "Tab") {
      hideDropdown();
    }
  }
  return { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem };
}

/** Object Store links. */
function NavObjectStoreDropdown(shouldOpenInNewTab) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    menuDisplayControl();
  return (
    <Dropdown
      onMouseOver={showDropdown}
      onKeyDown={onKeyDown}
      onMouseLeave={hideDropdown}
      show={show}
    >
      <Dropdown.Toggle className="nav-link">
        <DinaMessage id="objectStoreTitle" />
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item
          href="/object-store/upload"
          target={shouldOpenInNewTab ? "_blank" : ""}
        >
          <DinaMessage id="uploadPageTitle" />
        </Dropdown.Item>
        <Dropdown.Item
          href="/object-store/object/list"
          target={shouldOpenInNewTab ? "_blank" : ""}
        >
          <DinaMessage id="objectListTitle" />
        </Dropdown.Item>
        <Dropdown.Item
          href="/object-store/managedAttributesView/listView"
          target={shouldOpenInNewTab ? "_blank" : ""}
        >
          <DinaMessage id="managedAttributeListTitle" />
        </Dropdown.Item>
        <Dropdown.Item
          href="/object-store/object-subtype/list"
          target={shouldOpenInNewTab ? "_blank" : ""}
        >
          <DinaMessage id="objectSubtypeListTitle" />
        </Dropdown.Item>
        <Dropdown.Item
          href="/object-store/revisions-by-user"
          onKeyDown={onKeyDownLastItem}
          target={shouldOpenInNewTab ? "_blank" : ""}
        >
          <DinaMessage id="revisionsByUserPageTitle" />
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

/** Agents links. */
function NavAgentsDropdown(shouldOpenInNewTab) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    menuDisplayControl();
  return (
    <Dropdown
      show={show}
      onMouseOver={showDropdown}
      onMouseLeave={hideDropdown}
      onKeyDown={onKeyDown}
    >
      <Dropdown.Toggle className="nav-link">
        <DinaMessage id="agentsSectionTitle" />
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item href="/person/list" target={shouldOpenInNewTab? "_blank": ""}>
          <DinaMessage id="personListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/organization/list" onKeyDown={onKeyDownLastItem} target={shouldOpenInNewTab? "_blank": ""}>
          <DinaMessage id="organizationListTitle" />
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

/** Dina User links. */
function NavDinaUserDropdown(shouldOpenInNewTab) {
  const { subject } = useAccount();
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    menuDisplayControl();

  return (
    <Dropdown
      show={show}
      onMouseOver={showDropdown}
      onMouseLeave={hideDropdown}
      onKeyDown={onKeyDown}
    >
      <Dropdown.Toggle className="nav-link">
        <DinaMessage id="dinaUserSectionTitle" />
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item href="/dina-user/list" target={shouldOpenInNewTab? "_blank": ""}>
          <DinaMessage id="userListTitle" />
        </Dropdown.Item>
        <Dropdown.Item
          href={`/dina-user/view?id=${subject}`}
          onKeyDown={onKeyDownLastItem}
          target={shouldOpenInNewTab? "_blank": ""}
        >
          <DinaMessage id="whoAmITitle" />
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

/** Seqdb UI links. */
function NavSeqDBDropdown(shouldOpenInNewTab) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    menuDisplayControl();
  return (
    <Dropdown
      show={show}
      onMouseOver={showDropdown}
      onMouseLeave={hideDropdown}
      onKeyDown={onKeyDown}
    >
      <Dropdown.Toggle className="nav-link" href="#">
        <SeqdbMessage id="seqdbTitle" />
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item href="/seqdb/workflow/list" target={shouldOpenInNewTab? "_blank": ""}>
          <SeqdbMessage id="workflowListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/seqdb/sanger-workflow/list" target={shouldOpenInNewTab? "_blank": ""}>
          <SeqdbMessage id="sangerWorkflowListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/seqdb/index-set/list" target={shouldOpenInNewTab? "_blank": ""}>
          <SeqdbMessage id="indexSetListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/seqdb/pcr-primer/list" target={shouldOpenInNewTab? "_blank": ""}>
          <SeqdbMessage id="pcrPrimerListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/seqdb/pcr-profile/list" target={shouldOpenInNewTab? "_blank": ""}>
          <SeqdbMessage id="pcrProfileListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/seqdb/pcr-batch/list" target={shouldOpenInNewTab? "_blank": ""}>
          <SeqdbMessage id="pcrBatchListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/seqdb/product/list" target={shouldOpenInNewTab? "_blank": ""}>
          <SeqdbMessage id="productListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/seqdb/protocol/list" target={shouldOpenInNewTab? "_blank": ""}>
          <SeqdbMessage id="protocolListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/seqdb/region/list" target={shouldOpenInNewTab? "_blank": ""}>
          <SeqdbMessage id="regionListTitle" />
        </Dropdown.Item>
        <Dropdown.Item
          href="/seqdb/molecular-sample/list"
          onKeyDown={onKeyDownLastItem}
          target={shouldOpenInNewTab? "_blank": ""}
        >
          <SeqdbMessage id="molecularSampleListTitle" />
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

/** Collecting event links. */
function NavCollectionDropdown(shouldOpenInNewTab) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    menuDisplayControl();
  return (
    <Dropdown
      show={show}
      onMouseOver={showDropdown}
      onMouseLeave={hideDropdown}
      onKeyDown={onKeyDown}
    >
      <Dropdown.Toggle className="nav-link" href="#">
        <DinaMessage id="collectionSectionTitle" />
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item  href="/collection/collection/list" target={shouldOpenInNewTab? "_blank": ""}>
          <DinaMessage id="collectionListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/collection/collection-method/list" target={shouldOpenInNewTab? "_blank": ""}>
          <DinaMessage id="collectionMethodListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/collection/project/list" target={shouldOpenInNewTab? "_blank": ""}>
          <DinaMessage id="projectListTitle" />
        </Dropdown.Item>        
        <Dropdown.Item href="/collection/institution/list" target={shouldOpenInNewTab? "_blank": ""}>
          <DinaMessage id="institutionListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/collection/material-sample/list" target={shouldOpenInNewTab? "_blank": ""}>
          <DinaMessage id="materialSampleListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/collection/collecting-event/list" target={shouldOpenInNewTab? "_blank": ""}>
          <DinaMessage id="collectingEventListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/collection/acquisition-event/list" target={shouldOpenInNewTab? "_blank": ""}>
          <DinaMessage id="acquisitionEventListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/collection/preparation-type/list" target={shouldOpenInNewTab? "_blank": ""}>
          <DinaMessage id="preparationTypeListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/collection/storage-unit-type/list" target={shouldOpenInNewTab? "_blank": ""}>
          <DinaMessage id="storageUnitTypeListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/collection/storage-unit/list" target={shouldOpenInNewTab? "_blank": ""}>
          <DinaMessage id="storageUnitListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/collection/managed-attribute/list" target={shouldOpenInNewTab? "_blank": ""}>
          <DinaMessage id="managedAttributeListTitle" />
        </Dropdown.Item>
        <Dropdown.Item href="/collection/workflow-template/list" target={shouldOpenInNewTab? "_blank": ""}>
          <DinaMessage id="workflowTemplateListTitle" />
        </Dropdown.Item>
        <Dropdown.Item
          href="/collection/revisions-by-user"
          onKeyDown={onKeyDownLastItem}
          target={shouldOpenInNewTab? "_blank": ""}
        >
          <DinaMessage id="revisionsByUserPageTitle" />
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

export function Footer() {
  const { formatMessage } = useDinaIntl();
  return (
    <footer id="wb-info" className="my-3" style={{ zIndex: 0 }}>
      <div className="brand">
        <div className="container">
          <div className="row">
            <nav className="col-md-10 ftr-urlt-lnk py-3">
              <ul>
                <li>
                  <a href="https://www.canada.ca/en/contact.html" target="_blank">
                    <DinaMessage id="footerContactInfo" />
                  </a>
                </li>
                <li>
                  <a href="https://www.canada.ca/en/transparency/terms.html" target="_blank">
                    <DinaMessage id="footerTermsAndConditions" />
                  </a>
                </li>
                <li>
                  <a href="https://www.canada.ca/en/transparency/privacy.html" target="_blank">
                    <DinaMessage id="footerPrivacy"/>
                  </a>
                </li>
              </ul>
              <div>
                {process.env.UI_APP_VERSION && (
                  <DinaMessage
                    id="uiAppVersion"
                    values={{ version: process.env.UI_APP_VERSION }}
                  />
                )}
              </div>
            </nav>
            <div className="col-6 col-md-3 col-lg-2 text-end">
              <img
                src="https://www.canada.ca/etc/designs/canada/cdts/gcweb/v4_0_32/assets/wmms-blk.svg"
                alt={formatMessage("governmentOfCanadaSymbol")}
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
