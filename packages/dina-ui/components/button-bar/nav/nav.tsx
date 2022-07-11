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
import Button from "react-bootstrap/Button";
import Navbar from "react-bootstrap/Navbar";
import ReactNav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

export function Nav() {
  const { isAdmin, rolesPerGroup } = useAccount();
  const { formatMessage } = useDinaIntl();

  // Editable if current user is dina-admin, or a collection manager of any group:
  const showManagementNavigation =
    Object.values(rolesPerGroup ?? {})
      ?.flatMap(it => it)
      ?.includes("collection-manager") || isAdmin;

  return (
    <>
      <SkipLinks />

      <header className="mb-4">
        <Container fluid={true}>
          <Row xs={1} md={2} className="header-container row d-flex px-5">
            {/* Left section of the header */}
            <Col className="px-1">
              <GovernmentLogo />
            </Col>

            {/* Right section of the header */}
            <Col className="px-1 text-end">
              <ul className="list-inline mt-1 mb-1">
                <li className="list-inline-item mr-1 my-auto">
                  <FeedbackButton />
                </li>
                <li className="list-inline-item px-2">&#8211;</li>
                <li className="list-inline-item mr-0">
                  <LanguageSelector />
                </li>
              </ul>
              <ul className="list-inline">
                <li className="list-inline-item my-auto">
                  <NavbarUserControl />
                </li>
              </ul>
            </Col>
          </Row>
        </Container>
        <Navbar className="app-bar" expand="lg">
          <Container fluid={true} className="px-5">
            <Navbar.Brand href="/" className="app-name">
              <DinaMessage id="appTitle" />
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              {/* Navigation menu left */}
              <ReactNav>
                <NavCollectionDropdown formatMessage={formatMessage} />
                <NavTransactionsDropdown formatMessage={formatMessage} />
                <NavObjectStoreDropdown formatMessage={formatMessage} />
                <NavAgentDropdown formatMessage={formatMessage} />
                <NavSequenceDropdown formatMessage={formatMessage} />
              </ReactNav>

              {/* Navigation menu right */}
              <ReactNav style={{ marginLeft: "auto" }}>
                {showManagementNavigation && (
                  <NavDinaManagementDropdown formatMessage={formatMessage} />
                )}
              </ReactNav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </header>
    </>
  );
}

function SkipLinks() {
  return (
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
  );
}

function FeedbackButton() {
  return (
    <Button
      variant="link"
      className="px-0"
      href="https://github.com/AAFC-BICoE/dina-planning/issues/new?labels=demo%20feedback"
    >
      <DinaMessage id="feedbackButtonText" />
    </Button>
  );
}

function GovernmentLogo() {
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

  return (
    <>
      <img
        src={"/static/images/canadaLogo_" + locale + ".svg"}
        property="logo"
        alt=""
        className="logo"
      />
      {logoSpan}
      <meta property="areaServed" typeof="Country" content="Canada" />
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
      <NavDropdown.Item href="/collection/collecting-event/list">
        <DinaMessage id="collectingEventListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/managed-attributes-view/list">
        <DinaMessage id="managedAttributesViews" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/material-sample/list">
        <DinaMessage id="materialSampleListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/revisions-by-user">
        <DinaMessage id="revisionsByUserPageTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/storage-unit/list">
        <DinaMessage id="storageUnitListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        href="/collection/form-template/list"
        onKeyDown={onKeyDownLastItem}
      >
        <DinaMessage id="workflowTemplates" />
      </NavDropdown.Item>
    </NavDropdown>
  );
}

function NavTransactionsDropdown({ formatMessage }) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    menuDisplayControl();

  return (
    <NavDropdown
      title={formatMessage("loanTransactionsSectionTitle")}
      show={show}
      onMouseOver={showDropdown}
      onMouseLeave={hideDropdown}
      onKeyDown={onKeyDown}
    >
      <NavDropdown.Item href="/loan-transaction/revisions-by-user">
        <DinaMessage id="revisionsByUserPageTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        href="/loan-transaction/transaction/list"
        onKeyDown={onKeyDownLastItem}
      >
        <DinaMessage id="transactions" />
      </NavDropdown.Item>
    </NavDropdown>
  );
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
      <NavDropdown.Item href="/object-store/metadata/external-resource-edit">
        <DinaMessage id="externalResourceListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/object-store/object-subtype/list">
        <DinaMessage id="objectSubtypeListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/object-store/revisions-by-user">
        <DinaMessage id="revisionsByUserPageTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/object-store/object/list">
        <DinaMessage id="objectListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        href="/object-store/upload"
        onKeyDown={onKeyDownLastItem}
      >
        <DinaMessage id="uploadPageTitle" />
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
      <NavDropdown.Item href="/organization/list">
        <DinaMessage id="organizationListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/person/list" onKeyDown={onKeyDownLastItem}>
        <DinaMessage id="personListTitle" />
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
      <NavDropdown.Item href="/seqdb/index-set/list">
        <SeqdbMessage id="indexSetListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/seqdb/molecular-sample/list">
        <SeqdbMessage id="molecularSampleListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/seqdb/workflow/list">
        <SeqdbMessage id="workflowListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/seqdb/pcr-batch/list">
        <SeqdbMessage id="pcrBatchListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/seqdb/pcr-primer/list">
        <SeqdbMessage id="pcrPrimerListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/seqdb/product/list">
        <SeqdbMessage id="productListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/seqdb/region/list">
        <SeqdbMessage id="regionListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/seqdb/sanger-workflow/list">
        <SeqdbMessage id="sangerWorkflowListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        href="/seqdb/pcr-profile/list"
        onKeyDown={onKeyDownLastItem}
      >
        <SeqdbMessage id="pcrProfileListTitle" />
      </NavDropdown.Item>
    </NavDropdown>
  );
}

function NavDinaManagementDropdown({ formatMessage }) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    menuDisplayControl();
  const { isAdmin } = useAccount();
  return (
    <NavDropdown
      title={formatMessage("dinaManagementSectionTitle")}
      onMouseOver={showDropdown}
      onKeyDown={onKeyDown}
      onMouseLeave={hideDropdown}
      show={show}
      className="float-right"
    >
      <NavDropdown.Item href="/collection/collection-method/list">
        <DinaMessage id="collectionMethodListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/collection/list">
        <DinaMessage id="collectionListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/managed-attributes-view/list">
        <DinaMessage id="managedAttributesViews" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/extension/list">
        <DinaMessage id="fieldExtensions" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/institution/list">
        <DinaMessage id="institutionListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/managed-attribute/list">
        <DinaMessage id="managedAttributes" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/object-store/object-subtype/list">
        <DinaMessage id="objectSubtypeListTitle" />
      </NavDropdown.Item>
      {/* Permission page here. */}
      <NavDropdown.Item href="/collection/preparation-method/list">
        <DinaMessage id="preparationMethodListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/preparation-type/list">
        <DinaMessage id="preparationTypeListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/project/list">
        <DinaMessage id="projectListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item href="/collection/protocol/list">
        <DinaMessage id="protocolListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        href="/collection/storage-unit-type/list"
        onKeyDown={!isAdmin ? onKeyDownLastItem : undefined}
      >
        <DinaMessage id="storageUnitTypeListTitle" />
      </NavDropdown.Item>

      {/* Admins only can view users. */}
      {isAdmin && (
        <NavDropdown.Item href="/dina-user/list" onKeyDown={onKeyDownLastItem}>
          <DinaMessage id="userListTitle" />
        </NavDropdown.Item>
      )}
    </NavDropdown>
  );
}

export function Footer() {
  const { formatMessage } = useDinaIntl();
  return (
    <footer id="wb-info" className="mt-3" style={{ zIndex: 0 }}>
      <div className="brand">
        <Container fluid={true}>
          <div className="row px-5">
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
            <div className="col-6 col-md-3 col-lg-2 text-end pt-2">
              <img
                src="https://www.canada.ca/etc/designs/canada/cdts/gcweb/v4_0_32/assets/wmms-blk.svg"
                alt={formatMessage("governmentOfCanadaSymbol")}
                className="mt-4"
              />
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
