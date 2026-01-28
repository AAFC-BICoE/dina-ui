import { GlobalSearch, useAccount } from "common-ui";
import { SUPER_USER } from "common-ui/types/DinaRoles";
import Link from "next/link";
import { useRouter } from "next/router";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Stack from "react-bootstrap/Stack";
import { Footer, Head, Nav } from "../components";
import { DinaMessage, useDinaIntl } from "../intl/dina-ui-intl";
import { SeqdbMessage } from "../intl/seqdb-intl";

export function Home() {
  const { isAdmin, rolesPerGroup, subject } = useAccount();
  const router = useRouter();

  const handleSearch = (searchTerm: string) => {
    // Navigate to global search results page
    router.push(`/global-search?q=${encodeURIComponent(searchTerm)}`);
  };

  const showManagementNavigation =
    Object.values(rolesPerGroup ?? {})
      ?.flatMap((it) => it)
      ?.includes(SUPER_USER) || isAdmin;

  return (
    <div>
      <Head title={useDinaIntl().formatMessage("dinaHomeH1")} />
      <Nav />
      <main role="main">
        <Container fluid={true}>
          {/* Global Search - Centered at 80% width */}
          <div className="d-flex justify-content-center mb-4">
            <div style={{ width: "80%" }}>
              <GlobalSearch onSearch={handleSearch} />
            </div>
          </div>

          {/* Split page into lg sections */}
          <Row lg={4} md={2} xs={1}>
            {/* Collection Links */}
            <Col className="mb-4">
              <h2>
                <DinaMessage id="collectionSectionTitle" />
              </h2>

              <Stack style={{ display: "inline-flex" }}>
                <Link href="/collection/assemblage/list">
                  <DinaMessage id="title_assemblage" />
                </Link>
                <Link href="/collection/collecting-event/list">
                  <DinaMessage id="collectingEventListTitle" />
                </Link>
                <Link href="/collection/collection/list">
                  <DinaMessage id="collectionListTitle" />
                </Link>
                <Link href="/collection/material-sample/list">
                  <DinaMessage id="materialSampleListTitle" />
                </Link>
                <Link href="/collection/revisions-by-user">
                  <DinaMessage id="revisionsByUserPageTitle" />
                </Link>
                <Link href="/collection/storage-unit/list">
                  <DinaMessage id="storageUnitListTitle" />
                </Link>
                <Link href="/collection/project/list">
                  <DinaMessage id="projectListTitle" />
                </Link>
                <Link href="/workbook/upload">
                  <DinaMessage id="workbookGroupUploadTitle" />
                </Link>
              </Stack>
            </Col>

            {/* Transaction Links */}
            <Col className="mb-4">
              <h2>
                <DinaMessage id="loanTransactionsSectionTitle" />
              </h2>

              <Stack style={{ display: "inline-flex" }}>
                <Link href="/loan-transaction/revisions-by-user">
                  <DinaMessage id="revisionsByUserPageTitle" />
                </Link>
                <Link href="/loan-transaction/transaction/list">
                  <DinaMessage id="transactions" />
                </Link>
              </Stack>
            </Col>

            {/* Object Store Links */}
            <Col className="mb-4">
              <h2>
                <DinaMessage id="objectStoreTitle" />
              </h2>

              <Stack style={{ display: "inline-flex" }}>
                <Link href="/object-store/metadata/external-resource-edit">
                  <DinaMessage id="externalResourceListTitle" />
                </Link>
                <Link href="/object-store/object-subtype/list">
                  <DinaMessage id="objectSubtypeListTitle" />
                </Link>
                <Link href="/object-store/revisions-by-user">
                  <DinaMessage id="revisionsByUserPageTitle" />
                </Link>
                <Link href="/object-store/object/list">
                  <DinaMessage id="objectListTitle" />
                </Link>
                <Link href="/object-store/upload">
                  <DinaMessage id="uploadPageTitle" />
                </Link>
              </Stack>
            </Col>

            {/* Agents Links */}
            <Col className="mb-4">
              <h2>
                <DinaMessage id="agentsSectionTitle" />
              </h2>

              <Stack style={{ display: "inline-flex" }}>
                <Link href="/organization/list" passHref={true}>
                  <DinaMessage id="organizationListTitle" />
                </Link>
                <Link href="/person/list">
                  <DinaMessage id="personListTitle" />
                </Link>
              </Stack>
            </Col>

            {/* Sequencing Links */}
            <Col className="mb-4">
              <h2>
                <SeqdbMessage id="seqdbTitle" />
              </h2>

              <Stack style={{ display: "inline-flex" }}>
                <Link href="/seqdb/index-set/list">
                  <SeqdbMessage id="indexSetListTitle" />
                </Link>
                <Link href="/seqdb/library-prep-batch/list">
                  <SeqdbMessage id="libraryPrepBatchListTitle" />
                </Link>
                <Link href="/seqdb/metagenomics-workflow/list">
                  <SeqdbMessage id="metagenomicsWorkflowTitle" />
                </Link>
                <Link href="/seqdb/molecular-analysis-run/list">
                  <SeqdbMessage id="molecularAnalysisRunListTitle" />
                </Link>
                <Link href="/seqdb/molecular-analysis-workflow/list">
                  <SeqdbMessage id="molecularAnalysisWorkflowTitle" />
                </Link>
                <Link href="/seqdb/ngs-workflow/list" passHref={true}>
                  <SeqdbMessage id="ngsWorkflowWholeGenomeSeqTitle" />
                </Link>
                <Link href="/seqdb/ngs-workflow-pooling/list" passHref={true}>
                  <SeqdbMessage id="ngsWorkflowWholeGenomeSeqPoolingTitle" />
                </Link>
                <Link href="/seqdb/pcr-batch/list">
                  <SeqdbMessage id="pcrBatchListTitle" />
                </Link>
                <Link href="/seqdb/pcr-primer/list">
                  <SeqdbMessage id="pcrPrimerListTitle" />
                </Link>
                <Link href="/seqdb/pcr-workflow/list">
                  <SeqdbMessage id="pcrWorkflowListTitle" />
                </Link>
                <Link href="/seqdb/product/list">
                  <SeqdbMessage id="productListTitle" />
                </Link>
                <Link href="/seqdb/region/list">
                  <SeqdbMessage id="regionListTitle" />
                </Link>
                <Link href="/seqdb/seq-batch/list" passHref={true}>
                  <SeqdbMessage id="seqBatchListTitle" />
                </Link>
                <Link href="/seqdb/seq-submission/list" passHref={true}>
                  <SeqdbMessage id="seqSubmissionListTitle" />
                </Link>
                <Link href="/seqdb/sequencing-facility/list">
                  <SeqdbMessage id="sequencingFacilityListTitle" />
                </Link>
                <Link href="/seqdb/seq-workflow/list">
                  <SeqdbMessage id="sangerWorkflowSequencingListTitle" />
                </Link>
                <Link href="/seqdb/thermocycler-profile/list">
                  <SeqdbMessage id="thermocyclerProfileListTitle" />
                </Link>
              </Stack>
            </Col>

            {/* Controlled Vocabulary Links */}
            <Col className="mb-4">
              <h2>
                <DinaMessage id="controlledVocabularyTitle" />
              </h2>

              <Stack style={{ display: "inline-flex" }}>
                <Link href="/collection/collection-method/list">
                  <DinaMessage id="collectionMethodListTitle" />
                </Link>
                <Link href="/collection/extension/list">
                  <DinaMessage id="fieldExtensions" />
                </Link>
                <Link href="/identifier/list">
                  <DinaMessage id="identifiers" />
                </Link>
                <Link href="/collection/institution/list">
                  <DinaMessage id="institutionListTitle" />
                </Link>
                <Link href="/managed-attribute/list">
                  <DinaMessage id="managedAttributes" />
                </Link>
                <Link href="/collection/preparation-method/list">
                  <DinaMessage id="title_preparationMethod" />
                </Link>
                <Link href="/collection/preparation-type/list">
                  <DinaMessage id="preparationTypeListTitle" />
                </Link>
                <Link href="/collection/protocol/list">
                  <DinaMessage id="protocolListTitle" />
                </Link>
                <Link href="/collection/storage-unit-type/list">
                  <DinaMessage id="storageUnitTypeListTitle" />
                </Link>
              </Stack>
            </Col>

            {/* Configuration Links */}
            <Col className="mb-4">
              <h2>
                <DinaMessage id="dinaConfigurationSectionTitle" />
              </h2>

              <Stack style={{ display: "inline-flex" }}>
                <Link href="/collection/form-template/list">
                  <DinaMessage id="formTemplates" />
                </Link>
                <Link href="/collection/split-configuration/list">
                  <DinaMessage id="splitConfigurationTitle" />
                </Link>
                <Link
                  href={{
                    pathname: `/dina-user/view`,
                    query: {
                      id: subject,
                      hideBackButton: true
                    }
                  }}
                >
                  <DinaMessage id="userProfile" />
                </Link>
              </Stack>
            </Col>

            {/* Management Links (Only visible to collection managers) */}
            {showManagementNavigation && (
              <Col className="mb-4">
                <h2>
                  <DinaMessage id="dinaManagementSectionTitle" />
                </h2>

                <Stack style={{ display: "inline-flex" }}>
                  <Link href="/group/list">
                    <DinaMessage id="groupListTitle" />
                  </Link>
                  {isAdmin && (
                    <>
                      <Link href="/dina-user/list">
                        <DinaMessage id="userListTitle" />
                      </Link>
                      <Link href="/export/report-template/upload">
                        <DinaMessage id="reportTemplateUpload" />
                      </Link>
                    </>
                  )}
                </Stack>
              </Col>
            )}
          </Row>
        </Container>
      </main>
      <Footer />
    </div>
  );
}

export default Home;
