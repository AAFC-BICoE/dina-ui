import {
  LanguageSelector,
  NavbarUserControl,
  intlContext,
  useAccount,
  useInstanceContext
} from "common-ui";
import { SUPER_USER } from "common-ui/types/DinaRoles";
import Link from "next/link";
import { useContext, useState } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import NavDropdown from "react-bootstrap/NavDropdown";
import Navbar from "react-bootstrap/Navbar";
import Row from "react-bootstrap/Row";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { UIPreferenceHook } from "../../home2/UIPreferenceHook";

export interface NavProps {
  marginBottom?: boolean;
  centered?: boolean;
}

export function Nav({ marginBottom = true, centered = true }: NavProps) {
  const { isAdmin, rolesPerGroup } = useAccount();
  const { formatMessage } = useDinaIntl();
  const instanceContext = useInstanceContext();

  const { useNewLayout } = UIPreferenceHook();

  const homeLink = useNewLayout ? "/feedback/home2" : "/";

  // Editable if current user is dina-admin, or a collection manager of any group:
  const showManagementNavigation =
    Object.values(rolesPerGroup ?? {})
      ?.flatMap((it) => it)
      ?.includes(SUPER_USER) || isAdmin;

  const instanceMode = instanceContext?.instanceMode ?? "developer";

  return (
    <>
      <SkipLinks />
      <header className={marginBottom ? "mb-4" : undefined}>
        <Container fluid={true} className={centered ? "centered" : ""}>
          <Row
            xs={1}
            md={2}
            className={
              "header-container row d-flex " + (!centered ? "px-5" : "")
            }
          >
            {/* Left section of the header */}
            <Col className={!centered ? "px-1" : ""}>
              <GovernmentLogo />
            </Col>

            {/* Right section of the header */}
            <Col className={"text-end " + (!centered ? "px-1" : "")}>
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
                  <div className="d-flex align-items-center">
                    <NavbarUserControl />
                  </div>
                </li>
              </ul>
            </Col>
          </Row>
        </Container>
        <Navbar
          className="app-bar"
          expand="lg"
          style={{
            backgroundColor: instanceContext?.instanceBannerColor ?? "#38414d"
          }}
        >
          <Container fluid={true} className={centered ? "centered" : "px-5"}>
            <Navbar.Brand as={Link} href={homeLink} className="app-name">
              {instanceMode === "PROD" || !instanceMode ? (
                <DinaMessage id="appTitle" />
              ) : (
                <DinaMessage
                  id="appTitleInstanceMode"
                  values={{ instanceMode }}
                />
              )}
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav" role="menubar">
              {/* Navigation menu left */}
              <NavCollectionDropdown formatMessage={formatMessage} />
              <NavTransactionsDropdown formatMessage={formatMessage} />
              <NavObjectStoreDropdown formatMessage={formatMessage} />
              <NavAgentDropdown formatMessage={formatMessage} />
              <NavSequenceDropdown formatMessage={formatMessage} />
              <NavControlledVocabularyDropdown formatMessage={formatMessage} />
              <NavDinaConfigurationDropdown formatMessage={formatMessage} />

              {/* Navigation menu right */}
              {showManagementNavigation && (
                <NavDinaManagementDropdown formatMessage={formatMessage} />
              )}
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
    <Link href="/feedback" role="button" className="btn btn-link px-0">
      <DinaMessage id="feedbackButtonText" />
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
    </>
  );
}

function useMenuDisplayControl() {
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
    useMenuDisplayControl();
  return (
    <NavDropdown
      title={formatMessage("collectionSectionTitle")}
      onMouseOver={showDropdown}
      onKeyDown={onKeyDown}
      onMouseLeave={hideDropdown}
      show={show}
      role="menuitem"
      menuRole="menu"
    >
      <NavDropdown.Item
        as={Link}
        href="/collection/assemblage/list"
        role="menuitem"
      >
        <DinaMessage id="title_assemblage" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/collection/collecting-event/list"
        role="menuitem"
      >
        <DinaMessage id="collectingEventListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/collection/collection/list"
        role="menuitem"
      >
        <DinaMessage id="collectionListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/collection/dataset/list"
        role="menuitem"
      >
        <DinaMessage id="datasetListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/collection/expedition/list"
        role="menuitem"
      >
        <DinaMessage id="expeditionListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item as={Link} href="/workbook/generator" role="menuitem">
        <DinaMessage id="workbookGenerateTemplateTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/collection/material-sample/list"
        role="menuitem"
      >
        <DinaMessage id="materialSampleListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/collection/revisions-by-user"
        role="menuitem"
      >
        <DinaMessage id="revisionsByUserPageTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item as={Link} href="/collection/site/list" role="menuitem">
        <DinaMessage id="siteListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/collection/storage-unit/list"
        role="menuitem"
      >
        <DinaMessage id="storageUnitListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/collection/project/list"
        role="menuitem"
      >
        <DinaMessage id="projectListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/collection/classification/taxonomic-hierarchy"
        onKeyDown={onKeyDownLastItem}
        role="menuitem"
      >
        <DinaMessage id="taxonomicHierarchy" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/workbook/upload"
        onKeyDown={onKeyDownLastItem}
        role="menuitem"
      >
        <DinaMessage id="workbookGroupUploadTitle" />
      </NavDropdown.Item>
    </NavDropdown>
  );
}

function NavTransactionsDropdown({ formatMessage }) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    useMenuDisplayControl();

  return (
    <NavDropdown
      title={formatMessage("loanTransactionsSectionTitle")}
      show={show}
      onMouseOver={showDropdown}
      onMouseLeave={hideDropdown}
      onKeyDown={onKeyDown}
      role="menuitem"
      menuRole="menu"
    >
      <NavDropdown.Item
        as={Link}
        href="/loan-transaction/revisions-by-user"
        role="menuitem"
      >
        <DinaMessage id="revisionsByUserPageTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/loan-transaction/transaction/list"
        onKeyDown={onKeyDownLastItem}
        role="menuitem"
      >
        <DinaMessage id="transactions" />
      </NavDropdown.Item>
    </NavDropdown>
  );
}

function NavObjectStoreDropdown({ formatMessage }) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    useMenuDisplayControl();
  return (
    <NavDropdown
      title={formatMessage("objectStoreTitle")}
      onMouseOver={showDropdown}
      onKeyDown={onKeyDown}
      onMouseLeave={hideDropdown}
      show={show}
      role="menuitem"
      menuRole="menu"
    >
      <NavDropdown.Item
        as={Link}
        href="/object-store/metadata/external-resource-edit"
        role="menuitem"
      >
        <DinaMessage id="externalResourceListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/object-store/object-subtype/list"
        role="menuitem"
      >
        <DinaMessage id="objectSubtypeListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/object-store/revisions-by-user"
        role="menuitem"
      >
        <DinaMessage id="revisionsByUserPageTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/object-store/object/list"
        role="menuitem"
      >
        <DinaMessage id="objectListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/object-store/upload"
        onKeyDown={onKeyDownLastItem}
        role="menuitem"
      >
        <DinaMessage id="uploadPageTitle" />
      </NavDropdown.Item>
    </NavDropdown>
  );
}

function NavAgentDropdown({ formatMessage }) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    useMenuDisplayControl();
  return (
    <NavDropdown
      title={formatMessage("agentsSectionTitle")}
      onMouseOver={showDropdown}
      onKeyDown={onKeyDown}
      onMouseLeave={hideDropdown}
      show={show}
      role="menuitem"
      menuRole="menu"
    >
      <NavDropdown.Item as={Link} href="/organization/list" role="menuitem">
        <DinaMessage id="organizationListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/person/list"
        onKeyDown={onKeyDownLastItem}
        role="menuitem"
      >
        <DinaMessage id="personListTitle" />
      </NavDropdown.Item>
    </NavDropdown>
  );
}

function NavSequenceDropdown({ formatMessage }) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    useMenuDisplayControl();
  return (
    <NavDropdown
      title={formatMessage("seqdbTitle")}
      onMouseOver={showDropdown}
      onKeyDown={onKeyDown}
      onMouseLeave={hideDropdown}
      show={show}
      role="menuitem"
      menuRole="menu"
    >
      <NavDropdown.Item as={Link} href="/seqdb/index-set/list" role="menuitem">
        <SeqdbMessage id="indexSetListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/seqdb/library-prep-batch/list"
        role="menuitem"
      >
        <SeqdbMessage id="libraryPrepBatchListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/seqdb/metagenomics-workflow/list"
        role="menuitem"
      >
        <SeqdbMessage id="metagenomicsWorkflowTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/seqdb/molecular-analysis-run/list"
        role="menuitem"
      >
        <SeqdbMessage id="molecularAnalysisRunListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/seqdb/molecular-analysis-workflow/list"
        role="menuitem"
      >
        <SeqdbMessage id="molecularAnalysisWorkflowTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/seqdb/ngs-workflow/list"
        role="menuitem"
      >
        <SeqdbMessage id="ngsWorkflowWholeGenomeSeqTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/seqdb/ngs-workflow-pooling/list"
        onKeyDown={onKeyDownLastItem}
        role="menuitem"
      >
        <SeqdbMessage id="ngsWorkflowWholeGenomeSeqPoolingTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item as={Link} href="/seqdb/pcr-batch/list" role="menuitem">
        <SeqdbMessage id="pcrBatchListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item as={Link} href="/seqdb/pcr-primer/list" role="menuitem">
        <SeqdbMessage id="pcrPrimerListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/seqdb/pcr-workflow/list"
        role="menuitem"
      >
        <SeqdbMessage id="pcrWorkflowListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item as={Link} href="/seqdb/product/list" role="menuitem">
        <SeqdbMessage id="productListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item as={Link} href="/seqdb/region/list" role="menuitem">
        <SeqdbMessage id="regionListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item as={Link} href="/seqdb/seq-batch/list" role="menuitem">
        <SeqdbMessage id="seqBatchListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/seqdb/seq-submission/list"
        role="menuitem"
      >
        <SeqdbMessage id="seqSubmissionListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/seqdb/sequencing-facility/list"
        role="menuitem"
      >
        <SeqdbMessage id="sequencingFacilityListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/seqdb/seq-workflow/list"
        role="menuitem"
      >
        <SeqdbMessage id="sangerWorkflowSequencingListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/seqdb/thermocycler-profile/list"
        onKeyDown={onKeyDownLastItem}
        role="menuitem"
      >
        <SeqdbMessage id="thermocyclerProfileListTitle" />
      </NavDropdown.Item>
    </NavDropdown>
  );
}

function NavControlledVocabularyDropdown({ formatMessage }) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    useMenuDisplayControl();
  return (
    <NavDropdown
      title={formatMessage("controlledVocabularyTitle")}
      onMouseOver={showDropdown}
      onKeyDown={onKeyDown}
      onMouseLeave={hideDropdown}
      show={show}
      role="menuitem"
      menuRole="menu"
    >
      <NavDropdown.Item
        as={Link}
        href="/controlled-vocabulary/list"
        role="menuitem"
      >
        <DinaMessage id="controlledVocabularyTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/collection/collection-method/list"
        role="menuitem"
      >
        <DinaMessage id="collectionMethodListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/collection/extension/list"
        role="menuitem"
      >
        <DinaMessage id="fieldExtensions" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/collection/institution/list"
        role="menuitem"
      >
        <DinaMessage id="institutionListTitle" />
      </NavDropdown.Item>
      {/* Permission page here. */}
      <NavDropdown.Item
        as={Link}
        href="/collection/preparation-method/list"
        role="menuitem"
      >
        <DinaMessage id="title_preparationMethod" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/collection/preparation-type/list"
        role="menuitem"
      >
        <DinaMessage id="preparationTypeListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/collection/protocol/list"
        role="menuitem"
      >
        <DinaMessage id="protocolListTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/collection/storage-unit-type/list"
        onKeyDown={onKeyDownLastItem}
        role="menuitem"
      >
        <DinaMessage id="storageUnitTypeListTitle" />
      </NavDropdown.Item>
    </NavDropdown>
  );
}

function NavDinaManagementDropdown({ formatMessage }) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    useMenuDisplayControl();
  const { isAdmin } = useAccount();
  return (
    <NavDropdown
      title={formatMessage("dinaManagementSectionTitle")}
      onMouseOver={showDropdown}
      onKeyDown={onKeyDown}
      onMouseLeave={hideDropdown}
      show={show}
      className="float-right management-dropdown"
      role="menuitem"
      menuRole="menu"
      style={{ marginLeft: "auto" }}
    >
      <NavDropdown.Item as={Link} href="/group/list" role="menuitem">
        <DinaMessage id="groupListTitle" />
      </NavDropdown.Item>
      {isAdmin && (
        <>
          <NavDropdown.Item as={Link} href="/dina-user/list" role="menuitem">
            <DinaMessage id="userListTitle" />
          </NavDropdown.Item>
          <NavDropdown.Item
            as={Link}
            href="/export/report-template/upload"
            role="menuitem"
          >
            <DinaMessage id="reportTemplateUpload" />
          </NavDropdown.Item>
          <NavDropdown.Item as={Link} href="/admin/system-info" role="menuitem">
            <DinaMessage id="systemInfoTitle" />
          </NavDropdown.Item>
          <NavDropdown.Item
            as={Link}
            href="/admin/reindex"
            onKeyDown={onKeyDownLastItem}
            role="menuitem"
          >
            <DinaMessage id="reindexDocumentsTitle" />
          </NavDropdown.Item>
        </>
      )}
    </NavDropdown>
  );
}

function NavDinaConfigurationDropdown({ formatMessage }) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    useMenuDisplayControl();

  const { subject } = useAccount();

  return (
    <NavDropdown
      title={formatMessage("dinaConfigurationSectionTitle")}
      onMouseOver={showDropdown}
      onKeyDown={onKeyDown}
      onMouseLeave={hideDropdown}
      show={show}
      role="menuitem"
      menuRole="menu"
    >
      <NavDropdown.Item
        as={Link}
        href="/collection/form-template/list"
        role="menuitem"
      >
        <DinaMessage id="formTemplates" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href="/collection/split-configuration/list"
        role="menuitem"
      >
        <DinaMessage id="splitConfigurationTitle" />
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        href={`/dina-user/view?id=${subject}&hideBackButton=true`}
        onKeyDown={onKeyDownLastItem}
        role="menuitem"
      >
        <DinaMessage id="userProfile" />
      </NavDropdown.Item>
    </NavDropdown>
  );
}

export interface FooterProps {
  centered?: boolean;
}

export function Footer({ centered = true }: FooterProps) {
  const { formatMessage } = useDinaIntl();
  return (
    <footer id="wb-info" className="mt-3" style={{ zIndex: 0 }}>
      <div className="brand">
        <div className={"container-fluid " + (centered ? "centered" : "")}>
          <div className={"row " + (!centered ? "px-5" : "")}>
            <nav className="col-md-10 ftr-urlt-lnk py-3">
              <ul>
                <li>
                  <Link
                    href="https://www.canada.ca/en/contact.html"
                    passHref={true}
                  >
                    <DinaMessage id="footerContactInfo" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.canada.ca/en/transparency/terms.html"
                    passHref={true}
                  >
                    <DinaMessage id="footerTermsAndConditions" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.canada.ca/en/transparency/privacy.html"
                    passHref={true}
                  >
                    <DinaMessage id="footerPrivacy" />
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
        </div>
      </div>
    </footer>
  );
}
