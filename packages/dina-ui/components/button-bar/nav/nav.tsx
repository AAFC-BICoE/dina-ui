import {
  LanguageSelector,
  NavbarUserControl,
  useAccount,
  intlContext
} from "common-ui";
import React from "react";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { useContext } from "react";
import Navbar from "react-bootstrap/Navbar";
import ReactNav from "react-bootstrap/Nav";
import Container from "react-bootstrap/Container";
import NavDropdown from "react-bootstrap/NavDropdown";

export function Nav() {
  const { isAdmin, rolesPerGroup } = useAccount();
  const { formatMessage } = useDinaIntl();
  const { subject } = useAccount();
  const { locale } = useContext(intlContext);

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
        <Navbar className="app-bar" expand="lg">
          <Container>
            <Navbar.Brand href="/" className="app-name">
              <DinaMessage id="appTitle" />
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <ReactNav className="me-auto">
                <NavDropdown title={formatMessage("objectStoreTitle")}>
                  <NavDropdown.Item href="/object-store/upload">
                    <DinaMessage id="uploadPageTitle" />
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
                  <NavDropdown.Item href="/object-store/revisions-by-user">
                    <DinaMessage id="revisionsByUserPageTitle" />
                  </NavDropdown.Item>
                </NavDropdown>
                <NavDropdown title={formatMessage("agentsSectionTitle")}>
                  <NavDropdown.Item href="/person/list">
                    <DinaMessage id="personListTitle" />
                  </NavDropdown.Item>
                  <NavDropdown.Item href="/organization/list">
                    <DinaMessage id="organizationListTitle" />
                  </NavDropdown.Item>
                </NavDropdown>
                <NavDropdown title={formatMessage("seqdbTitle")}>
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
                  <NavDropdown.Item href="/seqdb/molecular-sample/list">
                    <SeqdbMessage id="molecularSampleListTitle" />
                  </NavDropdown.Item>
                </NavDropdown>
                <NavDropdown title={formatMessage("collectionSectionTitle")}>
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
                  <NavDropdown.Item href="/collection/revisions-by-user">
                    <DinaMessage id="revisionsByUserPageTitle" />
                  </NavDropdown.Item>
                </NavDropdown>
                {showUserNav && (
                  <NavDropdown title={formatMessage("dinaUserSectionTitle")}>
                    <NavDropdown.Item href="/dina-user/list">
                      <DinaMessage id="userListTitle" />
                    </NavDropdown.Item>
                    <NavDropdown.Item href={`/dina-user/view?id=${subject}`}>
                      <DinaMessage id="whoAmITitle" />
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
              </ReactNav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </header>
    </>
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
