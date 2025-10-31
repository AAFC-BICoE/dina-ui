import {
  LanguageSelector,
  NavbarUserControl,
  intlContext,
  useAccount,
  useInstanceContext
} from "common-ui";
import { useRouter } from 'next/router';
import { SUPER_USER } from "common-ui/types/DinaRoles";
import Link from "next/link";
import { useContext, useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import NavDropdown from "react-bootstrap/NavDropdown";
import Navbar from "react-bootstrap/Navbar";
import Row from "react-bootstrap/Row";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { SeqdbMessage } from "../../../intl/seqdb-intl";

export interface NavProps {
  // Temporary prop for transitioning all pages to use the new layout.
  marginBottom?: boolean;
  centered?: boolean;
  isCustomizeMode?: boolean;
  setIsCustomizeMode?: (value: React.SetStateAction<boolean>) => void;
}

export function Nav({
  marginBottom = true, 
  centered = true, 
  isCustomizeMode, 
  setIsCustomizeMode = () => {}  
}: NavProps) {
  const router = useRouter();
  const { isAdmin, rolesPerGroup } = useAccount();
  const { formatMessage } = useDinaIntl();
  const instanceContext = useInstanceContext();

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
                    {router.pathname === '/feedback/home2' && (
                      <Button
                        variant={isCustomizeMode ? "success" : "outline-secondary"}
                        size="sm"
                        className="mr-2"
                        onClick={() => setIsCustomizeMode(prev => !prev)}
                      >
                        {isCustomizeMode ? "Done" : "Customize"}
                      </Button>
                    )}
                    {/* Conditional rendering of layout switch buttons */}
                    <div style={{ marginLeft: '20px' }}>
                    {router.pathname === '/' && (
                      <Link href="/feedback/home2" passHref legacyBehavior>
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          className="mr-2 shadow-sm"
                        >
                          🎨 Try New Layout
                        </Button>
                      </Link>
                    )}
                    {router.pathname === '/feedback/home2' && (
                      <Link href="/" passHref legacyBehavior>
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          className="mr-2 shadow-sm"
                        >
                          📋 Back to Classic Layout
                        </Button>
                      </Link>
                    )}
                    </div>
                    <div style={{ marginLeft: '20px' }}>
                      <NavbarUserControl />
                    </div>
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
            <Link href="/" passHref={true} legacyBehavior>
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
    <Link href={`/feedback`} passHref={true} legacyBehavior>
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
      <Link href="/collection/assemblage/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="title_assemblage" />
        </NavDropdown.Item>
      </Link>
      <Link
        href="/collection/collecting-event/list"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="collectingEventListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/collection/collection/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="collectionListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/workbook/generator" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="workbookGenerateTemplateTitle" />
        </NavDropdown.Item>
      </Link>
      <Link
        href="/collection/material-sample/list"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="materialSampleListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/collection/revisions-by-user" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="revisionsByUserPageTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/collection/storage-unit/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="storageUnitListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/collection/project/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="projectListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link
        href="/collection/classification/taxonomic-hierarchy"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item onKeyDown={onKeyDownLastItem} role="menuitem">
          <DinaMessage id="taxonomicHierarchy" />
        </NavDropdown.Item>
      </Link>
      <Link href="/workbook/upload" passHref={true} legacyBehavior>
        <NavDropdown.Item onKeyDown={onKeyDownLastItem} role="menuitem">
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
      role="menuitem"
      menuRole="menu"
    >
      <Link
        href="/loan-transaction/revisions-by-user"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="revisionsByUserPageTitle" />
        </NavDropdown.Item>
      </Link>
      <Link
        href="/loan-transaction/transaction/list"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item onKeyDown={onKeyDownLastItem} role="menuitem">
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
      role="menuitem"
      menuRole="menu"
    >
      <Link
        href="/object-store/metadata/external-resource-edit"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="externalResourceListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link
        href="/object-store/object-subtype/list"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="objectSubtypeListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link
        href="/object-store/revisions-by-user"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="revisionsByUserPageTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/object-store/object/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="objectListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/object-store/upload" passHref={true} legacyBehavior>
        <NavDropdown.Item onKeyDown={onKeyDownLastItem} role="menuitem">
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
      role="menuitem"
      menuRole="menu"
    >
      <Link href="/organization/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="organizationListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/person/list" passHref={true} legacyBehavior>
        <NavDropdown.Item onKeyDown={onKeyDownLastItem} role="menuitem">
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
      role="menuitem"
      menuRole="menu"
    >
      <Link href="/seqdb/index-set/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <SeqdbMessage id="indexSetListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link
        href="/seqdb/library-prep-batch/list"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <SeqdbMessage id="libraryPrepBatchListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link
        href="/seqdb/metagenomics-workflow/list"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <SeqdbMessage id="metagenomicsWorkflowTitle" />
        </NavDropdown.Item>
      </Link>
      <Link
        href="/seqdb/molecular-analysis-run/list"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <SeqdbMessage id="molecularAnalysisRunListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link
        href="/seqdb/molecular-analysis-workflow/list"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <SeqdbMessage id="molecularAnalysisWorkflowTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/ngs-workflow/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <SeqdbMessage id="ngsWorkflowWholeGenomeSeqTitle" />
        </NavDropdown.Item>
      </Link>
      <Link
        href="/seqdb/ngs-workflow-pooling/list"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item onKeyDown={onKeyDownLastItem} role="menuitem">
          <SeqdbMessage id="ngsWorkflowWholeGenomeSeqPoolingTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/pcr-batch/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <SeqdbMessage id="pcrBatchListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/pcr-primer/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <SeqdbMessage id="pcrPrimerListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/pcr-workflow/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <SeqdbMessage id="pcrWorkflowListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/product/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <SeqdbMessage id="productListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/region/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <SeqdbMessage id="regionListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/seq-batch/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <SeqdbMessage id="seqBatchListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/seq-submission/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <SeqdbMessage id="seqSubmissionListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link
        href="/seqdb/sequencing-facility/list"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <SeqdbMessage id="sequencingFacilityListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/seqdb/seq-workflow/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <SeqdbMessage id="sangerWorkflowSequencingListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link
        href="/seqdb/thermocycler-profile/list"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item onKeyDown={onKeyDownLastItem} role="menuitem">
          <SeqdbMessage id="thermocyclerProfileListTitle" />
        </NavDropdown.Item>
      </Link>
    </NavDropdown>
  );
}

function NavControlledVocabularyDropdown({ formatMessage }) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    menuDisplayControl();
  const { isAdmin } = useAccount();
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
      <Link
        href="/collection/collection-method/list"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="collectionMethodListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/collection/extension/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="fieldExtensions" />
        </NavDropdown.Item>
      </Link>
      <Link href="/identifier/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="identifiers" />
        </NavDropdown.Item>
      </Link>
      <Link href="/collection/institution/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="institutionListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/managed-attribute/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="managedAttributes" />
        </NavDropdown.Item>
      </Link>
      {/* Permission page here. */}
      <Link
        href="/collection/preparation-method/list"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="title_preparationMethod" />
        </NavDropdown.Item>
      </Link>
      <Link
        href="/collection/preparation-type/list"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="preparationTypeListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link href="/collection/protocol/list" passHref={true} legacyBehavior>
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="protocolListTitle" />
        </NavDropdown.Item>
      </Link>
      <Link
        href="/collection/storage-unit-type/list"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item
          onKeyDown={!isAdmin ? onKeyDownLastItem : undefined}
          role="menuitem"
        >
          <DinaMessage id="storageUnitTypeListTitle" />
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
      className="float-right management-dropdown"
      role="menuitem"
      menuRole="menu"
      style={{ marginLeft: "auto" }}
    >
      <Link
        href="/group/list"
        onKeyDown={onKeyDown}
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="groupListTitle" />
        </NavDropdown.Item>
      </Link>
      {/* Admins only can view users. */}
      {isAdmin && (
        <>
          <Link
            href="/dina-user/list"
            onKeyDown={onKeyDown}
            passHref={true}
            legacyBehavior
          >
            <NavDropdown.Item role="menuitem">
              <DinaMessage id="userListTitle" />
            </NavDropdown.Item>
          </Link>
          <Link
            href="/export/report-template/upload"
            onKeyDown={onKeyDownLastItem}
            passHref={true}
            legacyBehavior
          >
            <NavDropdown.Item role="menuitem">
              <DinaMessage id="reportTemplateUpload" />
            </NavDropdown.Item>
          </Link>
        </>
      )}
    </NavDropdown>
  );
}

function NavDinaConfigurationDropdown({ formatMessage }) {
  const { show, showDropdown, hideDropdown, onKeyDown, onKeyDownLastItem } =
    menuDisplayControl();

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
      <Link
        href="/collection/form-template/list"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="formTemplates" />
        </NavDropdown.Item>
      </Link>
      <Link
        href="/collection/split-configuration/list"
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="splitConfigurationTitle" />
        </NavDropdown.Item>
      </Link>
      <Link
        href={{
          pathname: `/dina-user/view`,
          query: {
            id: subject,
            hideBackButton: true
          }
        }}
        onKeyDown={onKeyDownLastItem}
        passHref={true}
        legacyBehavior
      >
        <NavDropdown.Item role="menuitem">
          <DinaMessage id="userProfile" />
        </NavDropdown.Item>
      </Link>
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
