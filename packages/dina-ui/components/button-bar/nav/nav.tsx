import {
  LanguageSelector,
  NavbarUserControl,
  useAccount,
  intlContext
} from "common-ui";
import React from "react";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { useContext, useState } from "react";
import Navbar from "react-bootstrap/Navbar";
import ReactNav from "react-bootstrap/Nav";
import Container from "react-bootstrap/Container";
import NavDropdown from "react-bootstrap/NavDropdown";

export function Nav() {
  const { isAdmin, rolesPerGroup } = useAccount();
  const { formatMessage } = useDinaIntl();
  const { locale } = useContext(intlContext);

  // Generate accessible message for Government of Canada Logo.
  const logoSpan =
    locale === "en" ? (
      <span className="wb-inv" property="name">
        Government of Canada / <span lang="fr">Gouvernement du Canada</span>
      </span>
    ) : (
      <span className="wb-inv" property="name">
        Gouvernement du Canada / <span lang="en">Government of Canada</span>
      </span>
    );

  // Editable if current user is dina-admin, or a collection manager of any group:
  const showUserNav =
    Object.values(rolesPerGroup ?? {})
      ?.flatMap(it => it)
      ?.includes("collection-manager") || isAdmin;

  return (
    <>
      <nav id="wb-tphp" className="d-flex flex-column align-items-center">
        <a className="wb-link-inv wb-sl" href="#wb-cont">
          <DinaMessage id="skipToMainContent" />
        </a>
        <a className="wb-link-inv wb-sl" href="#wb-info">
          <DinaMessage id="skipToAboutThisApplication" />
        </a>
        <a className="wb-link-inv wb-sl" rel="alternate" href="?wbdisable=true">
          <DinaMessage id="skipToBasicHtmlVersion" />
        </a>
      </nav>

      <header className="py-3">
        <div id="wb-bnr" className="container">
          <div className="row d-flex">
            <div
              className="brand col-5 col-md-4"
              property="publisher"
              typeof="GovernmentOrganization"
            >
              <img
                src={"/static/images/canadaLogo_" + locale + ".svg"}
                property="logo"
                alt=""
              />
              {logoSpan}
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
        <Navbar className="app-bar" expand="sm">
          <Container>
            <Navbar.Brand href="/" className="app-name">
              <DinaMessage id="appTitle" />
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <ReactNav className="">
                <NavObjectStoreDropdown formatMessage={formatMessage} />
                <NavAgentDropdown formatMessage={formatMessage} />
                <NavSequenceDropdown formatMessage={formatMessage} />
                <NavCollectionDropdown formatMessage={formatMessage} />
                {showUserNav && (
                  <NavDinaUserDropdown formatMessage={formatMessage} />
                )}
              </ReactNav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </header>
    </>
  );
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

function NavObjectStoreDropdown({ formatMessage }) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    menuDisplayControl();
  return (
    <NavDropdown
      title={formatMessage("objectStoreTitle")}
      onMouseOver={showDropdown}
      onKeyDown={onKeyDown}
      onMouseLeave={hideDropdown}
      show={show}
    >
      <NavDropdown.Item href="/object-store/upload">
        <DinaMessage id="uploadPageTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/object-store/metadata/external-resource-edit">
        <DinaMessage id="externalResourceListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/object-store/object/list">
        <DinaMessage id="objectListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/object-store/managedAttributesView/listView">
        <DinaMessage id="managedAttributeListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/object-store/object-subtype/list">
        <DinaMessage id="objectSubtypeListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        href="/object-store/revisions-by-user"
        onKeyDown={onKeyDownLastItem}
      >
        <DinaMessage id="revisionsByUserPageTitle" />
      </NavDropdown.Item>
    </NavDropdown>
  );
}

function NavAgentDropdown({ formatMessage }) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    menuDisplayControl();
  return (
    <NavDropdown
      title={formatMessage("agentsSectionTitle")}
      onMouseOver={showDropdown}
      onKeyDown={onKeyDown}
      onMouseLeave={hideDropdown}
      show={show}
    >
      <NavDropdown.Item href="/person/list">
        <DinaMessage id="personListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/organization/list" onKeyDown={onKeyDownLastItem}>
        <DinaMessage id="organizationListTitle" />
      </NavDropdown.Item>
    </NavDropdown>
  );
}

function NavSequenceDropdown({ formatMessage }) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    menuDisplayControl();
  return (
    <NavDropdown
      title={formatMessage("seqdbTitle")}
      onMouseOver={showDropdown}
      onKeyDown={onKeyDown}
      onMouseLeave={hideDropdown}
      show={show}
    >
      <NavDropdown.Item href="/seqdb/workflow/list">
        <SeqdbMessage id="workflowListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/seqdb/sanger-workflow/list">
        <SeqdbMessage id="sangerWorkflowListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/seqdb/index-set/list">
        <SeqdbMessage id="indexSetListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/seqdb/pcr-primer/list">
        <SeqdbMessage id="pcrPrimerListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/seqdb/pcr-profile/list">
        <SeqdbMessage id="pcrProfileListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/seqdb/pcr-batch/list">
        <SeqdbMessage id="pcrBatchListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/seqdb/product/list">
        <SeqdbMessage id="productListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/seqdb/protocol/list">
        <SeqdbMessage id="protocolListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/seqdb/region/list">
        <SeqdbMessage id="regionListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        href="/seqdb/molecular-sample/list"
        onKeyDown={onKeyDownLastItem}
      >
        <SeqdbMessage id="molecularSampleListTitle" />
      </NavDropdown.Item>
    </NavDropdown>
  );
}

function NavCollectionDropdown({ formatMessage }) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    menuDisplayControl();
  return (
    <NavDropdown
      title={formatMessage("collectionSectionTitle")}
      onMouseOver={showDropdown}
      onKeyDown={onKeyDown}
      onMouseLeave={hideDropdown}
      show={show}
    >
      <NavDropdown.Item href="/collection/collection/list">
        <DinaMessage id="collectionListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/collection-method/list">
        <DinaMessage id="collectionMethodListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/project/list">
        <DinaMessage id="projectListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/institution/list">
        <DinaMessage id="institutionListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/material-sample/list">
        <DinaMessage id="materialSampleListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/collecting-event/list">
        <DinaMessage id="collectingEventListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/acquisition-event/list">
        <DinaMessage id="acquisitionEventListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/preparation-type/list">
        <DinaMessage id="preparationTypeListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/storage-unit-type/list">
        <DinaMessage id="storageUnitTypeListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/storage-unit/list">
        <DinaMessage id="storageUnitListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/managed-attribute/list">
        <DinaMessage id="managedAttributeListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/workflow-template/list">
        <DinaMessage id="workflowTemplateListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/extension/list">
        <DinaMessage id="extensionListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        href="/collection/revisions-by-user"
        onKeyDown={onKeyDownLastItem}
      >
        <DinaMessage id="revisionsByUserPageTitle" />
      </NavDropdown.Item>
    </NavDropdown>
  );
}

function NavDinaUserDropdown({ formatMessage }) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    menuDisplayControl();
  const { subject } = useAccount();
  return (
    <NavDropdown
      title={formatMessage("dinaUserSectionTitle")}
      onMouseOver={showDropdown}
      onKeyDown={onKeyDown}
      onMouseLeave={hideDropdown}
      show={show}
    >
      <NavDropdown.Item href="/dina-user/list">
        <DinaMessage id="userListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        href={`/dina-user/view?id=${subject}`}
        onKeyDown={onKeyDownLastItem}
      >
        <DinaMessage id="whoAmITitle" />
      </NavDropdown.Item>
    </NavDropdown>
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
                  <a href="https://www.canada.ca/en/contact.html">
                    <DinaMessage id="footerContactInfo" />
                  </a>
                </li>
                <li>
                  <a href="https://www.canada.ca/en/transparency/terms.html">
                    <DinaMessage id="footerTermsAndConditions" />
                  </a>
                </li>
                <li>
                  <a href="https://www.canada.ca/en/transparency/privacy.html">
                    <DinaMessage id="footerPrivacy" />
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
