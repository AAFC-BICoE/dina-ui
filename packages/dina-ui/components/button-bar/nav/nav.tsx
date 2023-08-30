import {
  LanguageSelector,
  NavbarUserControl,
  useAccount,
  intlContext
} from "common-ui";
import React from "react";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { useContext, useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Navbar from "react-bootstrap/Navbar";
import ReactNav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { SUPER_USER } from "common-ui/types/DinaRoles";
import Link from "next/link";
import axios from "axios";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import ButtonGroup from "react-bootstrap/ButtonGroup";

export interface NavProps {
  // Temporary prop for transitioning all pages to use the new layout.
  marginBottom?: boolean;
}

export function Nav({ marginBottom = true }: NavProps) {
  const { isAdmin, rolesPerGroup } = useAccount();
  const { formatMessage } = useDinaIntl();
  const [instanceMode, setInstanceMode] = useState();

  useEffect(() => {
    const getInstanceMode = async () => {
      try {
        const response = await axios.get(`/instance.json`);
        setInstanceMode(response.data["instance-mode"]);
      } catch (error) {
        setInstanceMode(undefined);
      }
    };
    getInstanceMode();
  }, []);

  // Editable if current user is dina-admin, or a collection manager of any group:
  const showManagementNavigation =
    Object.values(rolesPerGroup ?? {})
      ?.flatMap((it) => it)
      ?.includes(SUPER_USER) || isAdmin;

  return (
    <>
      <SkipLinks />

      <header className={marginBottom ? "mb-4" : undefined}>
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
            <Link href="/" passHref={true}>
              <Navbar.Brand href="/" className="app-name">
                {instanceMode === "PROD" || !instanceMode ? (
                  <DinaMessage id="appTitle" />
                ) : (
                  <DinaMessage
                    id="appTitleInstanceMode"
                    values={{ instanceMode }}
                  />
                )}
              </Navbar.Brand>
            </Link>
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
    <Link
      href="https://github.com/AAFC-BICoE/dina-planning/issues/new?labels=demo%20feedback"
      passHref={true}
    >
      <Button variant="link" className="px-0">
        <DinaMessage id="feedbackButtonText" />
      </Button>
    </Link>
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
  const {
    show: submenuShow,
    showDropdown: submenuShowDropdown,
    hideDropdown: submenuHideDropdown,
    onKeyDown: submenuOnKeyDown,
    onKeyDownLastItem: submenuOnKeyDownLastItem
  } = menuDisplayControl();
  return (
    <NavDropdown
      title={formatMessage("collectionSectionTitle")}
      onMouseOver={showDropdown}
      onKeyDown={onKeyDown}
      onMouseLeave={hideDropdown}
      show={show}
    >
      <Link href="/collection/assemblage/list" passHref={true}>
        <NavDropdown.Item>
          <DinaMessage id="title_assemblage" />
        </NavDropdown.Item>
      </Link>
      <Link href="/collection/collecting-event/list" passHref={true}>
        <NavDropdown.Item>
          <DinaMessage id="collectingEventListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/collection/collection/list" passHref={true}>
        <NavDropdown.Item>
          <DinaMessage id="collectionListTitle" />
        </NavDropdown.Item>
      </Link>
      {/* Controlled Vocabulary submenu */}
      <DropdownButton
        title={formatMessage("controlledVocabularyTitle")}
        drop={"end"}
        onMouseOverCapture={submenuShowDropdown}
        onKeyDown={submenuOnKeyDown}
        onMouseLeave={submenuHideDropdown}
        show={submenuShow}
        className="submenu"
        variant="light"
      >
        <Link href="/collection/collection-method/list" passHref={true}>
          <NavDropdown.Item>
            <DinaMessage id="collectionMethodListTitle" />
          </NavDropdown.Item>
        </Link>
        <Link href="/collection/preparation-method/list" passHref={true}>
          <NavDropdown.Item>
            <DinaMessage id="title_preparationMethod" />
          </NavDropdown.Item>
        </Link>
        <Link href="/collection/preparation-type/list" passHref={true}>
          <NavDropdown.Item onKeyDown={submenuOnKeyDownLastItem}>
            <DinaMessage id="preparationTypeListTitle" />
          </NavDropdown.Item>
        </Link>
      </DropdownButton>
      <Link href="/collection/material-sample/list" passHref={true}>
        <NavDropdown.Item>
          <DinaMessage id="materialSampleListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/collection/revisions-by-user" passHref={true}>
        <NavDropdown.Item>
          <DinaMessage id="revisionsByUserPageTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/collection/storage-unit/list" passHref={true}>
        <NavDropdown.Item>
          <DinaMessage id="storageUnitListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/collection/project/list" passHref={true}>
        <NavDropdown.Item>
          <DinaMessage id="projectListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/workbook/upload" passHref={true}>
        <NavDropdown.Item onKeyDown={onKeyDownLastItem}>
          <DinaMessage id="workbookGroupUploadTitle" />
        </NavDropdown.Item>
      </Link>
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
      <Link href="/loan-transaction/revisions-by-user" passHref={true}>
        <NavDropdown.Item>
          <DinaMessage id="revisionsByUserPageTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/loan-transaction/transaction/list" passHref={true}>
        <NavDropdown.Item onKeyDown={onKeyDownLastItem}>
          <DinaMessage id="transactions" />
        </NavDropdown.Item>
      </Link>
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
      <Link
        href="/object-store/metadata/external-resource-edit"
        passHref={true}
      >
        <NavDropdown.Item>
          <DinaMessage id="externalResourceListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/object-store/object-subtype/list" passHref={true}>
        <NavDropdown.Item>
          <DinaMessage id="objectSubtypeListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/object-store/revisions-by-user" passHref={true}>
        <NavDropdown.Item>
          <DinaMessage id="revisionsByUserPageTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/object-store/object/list" passHref={true}>
        <NavDropdown.Item>
          <DinaMessage id="objectListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/object-store/upload" passHref={true}>
        <NavDropdown.Item onKeyDown={onKeyDownLastItem}>
          <DinaMessage id="uploadPageTitle" />
        </NavDropdown.Item>
      </Link>
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
      <Link href="/organization/list" passHref={true}>
        <NavDropdown.Item>
          <DinaMessage id="organizationListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/person/list" passHref={true}>
        <NavDropdown.Item onKeyDown={onKeyDownLastItem}>
          <DinaMessage id="personListTitle" />
        </NavDropdown.Item>
      </Link>
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
      <Link href="/seqdb/index-set/list" passHref={true}>
        <NavDropdown.Item>
          <SeqdbMessage id="indexSetListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/library-prep-batch/list" passHref={true}>
        <NavDropdown.Item>
          <SeqdbMessage id="libraryPrepBatchListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/ngs-workflow/list" passHref={true}>
        <NavDropdown.Item>
          <SeqdbMessage id="ngsWorkflowWholeGenomeSeqTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/ngs-workflow-pooling/list" passHref={true}>
        <NavDropdown.Item onKeyDown={onKeyDownLastItem}>
          <SeqdbMessage id="ngsWorkflowWholeGenomeSeqPoolingTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/molecular-sample/list" passHref={true}>
        <NavDropdown.Item>
          <SeqdbMessage id="molecularSampleListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/workflow/list" passHref={true}>
        <NavDropdown.Item>
          <SeqdbMessage id="workflowListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/pcr-batch/list" passHref={true}>
        <NavDropdown.Item>
          <SeqdbMessage id="pcrBatchListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/pcr-primer/list" passHref={true}>
        <NavDropdown.Item>
          <SeqdbMessage id="pcrPrimerListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/pcr-workflow/list" passHref={true}>
        <NavDropdown.Item>
          <SeqdbMessage id="pcrWorkflowListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/product/list" passHref={true}>
        <NavDropdown.Item>
          <SeqdbMessage id="productListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/region/list" passHref={true}>
        <NavDropdown.Item>
          <SeqdbMessage id="regionListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/seq-batch/list" passHref={true}>
        <NavDropdown.Item>
          <SeqdbMessage id="seqBatchListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/seq-submission/list" passHref={true}>
        <NavDropdown.Item>
          <SeqdbMessage id="seqSubmissionListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/sequencing-facility/list" passHref={true}>
        <NavDropdown.Item>
          <SeqdbMessage id="sequencingFacilityListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/seq-workflow/list" passHref={true}>
        <NavDropdown.Item>
          <SeqdbMessage id="sangerWorkflowSequencingListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/thermocycler-profile/list" passHref={true}>
        <NavDropdown.Item onKeyDown={onKeyDownLastItem}>
          <SeqdbMessage id="thermocyclerProfileListTitle" />
        </NavDropdown.Item>
      </Link>
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
      <Link href="/collection/extension/list" passHref={true}>
        <NavDropdown.Item>
          <DinaMessage id="fieldExtensions" />
        </NavDropdown.Item>
      </Link>
      <Link href="/collection/form-template/list" passHref={true}>
        <NavDropdown.Item>
          <DinaMessage id="formTemplates" />
        </NavDropdown.Item>
      </Link>
      <Link href="/collection/institution/list" passHref={true}>
        <NavDropdown.Item>
          <DinaMessage id="institutionListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/managed-attribute/list" passHref={true}>
        <NavDropdown.Item>
          <DinaMessage id="managedAttributes" />
        </NavDropdown.Item>
      </Link>
      {/* Permission page here. */}
      <Link href="/collection/protocol/list" passHref={true}>
        <NavDropdown.Item>
          <DinaMessage id="protocolListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/collection/storage-unit-type/list" passHref={true}>
        <NavDropdown.Item onKeyDown={!isAdmin ? onKeyDownLastItem : undefined}>
          <DinaMessage id="storageUnitTypeListTitle" />
        </NavDropdown.Item>
      </Link>

      {/* Admins only can view users. */}
      {isAdmin && (
        <Link
          href="/dina-user/list"
          onKeyDown={onKeyDownLastItem}
          passHref={true}
        >
          <NavDropdown.Item>
            <DinaMessage id="userListTitle" />
          </NavDropdown.Item>
        </Link>
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
                  <Link
                    href="https://www.canada.ca/en/contact.html"
                    passHref={true}
                  >
                    <a>
                      <DinaMessage id="footerContactInfo" />
                    </a>
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.canada.ca/en/transparency/terms.html"
                    passHref={true}
                  >
                    <a>
                      <DinaMessage id="footerTermsAndConditions" />
                    </a>
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.canada.ca/en/transparency/privacy.html"
                    passHref={true}
                  >
                    <a>
                      <DinaMessage id="footerPrivacy" />
                    </a>
                  </Link>
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
