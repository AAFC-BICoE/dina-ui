import { useAccount } from "common-ui";
import Link from "next/link";
import React from "react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import { Footer, Head, Nav } from "../components";
import { DinaMessage, useDinaIntl } from "../intl/dina-ui-intl";
import { SeqdbMessage } from "../intl/seqdb-intl";

export function Home() {
  const { isAdmin, rolesPerGroup } = useAccount();

  const showManagementNavigation =
    Object.values(rolesPerGroup ?? {})
      ?.flatMap(it => it)
      ?.includes("collection-manager") || isAdmin;

  return (
    <div>
      <Head title={useDinaIntl().formatMessage("dinaHomeH1")} />
      <Nav />
      <main role="main">
        <Container fluid={true} className="px-5">
          {/* Quick create menu */}
          <Card bg="light" className="mb-4">
            <Card.Body>
              <span className="mx-3">
                <DinaMessage id="createNewLabel" />:
              </span>

              <Button
                href="/collection/material-sample/edit"
                variant="info"
                className="mx-1 my-1"
              >
                <DinaMessage id="materialSample" />
              </Button>
              <Button
                href="/collection/material-sample/bulk-create"
                variant="info"
                className="mx-1 my-1"
              >
                <DinaMessage id="multipleMaterialSamples" />
              </Button>
              <Button
                href="/collection/collecting-event/edit"
                variant="info"
                className="mx-1 my-1"
              >
                <DinaMessage id="collectingEvent" />
              </Button>
              <Button
                href="/loan-transaction/transaction/edit"
                variant="info"
                className="mx-1 my-1"
              >
                <DinaMessage id="loanTransaction" />
              </Button>
              <Button
                href="/object-store/upload"
                variant="info"
                className="mx-1 my-1"
              >
                <DinaMessage id="uploadPageTitle" />
              </Button>
            </Card.Body>
          </Card>

          {/* Split page into three sections */}
          <Row lg={3} md={2} xs={1} className="mb-5">
            {/* Collection Links */}
            <Col className="mb-4">
              <h2>
                <DinaMessage id="collectionSectionTitle" />
              </h2>

              <Stack style={{ display: "inline-flex" }}>
                <Link href="/collection/collecting-event/list">
                  <a>
                    <DinaMessage id="collectingEventListTitle" />
                  </a>
                </Link>
                <Link href="/collection/managed-attributes-view/list">
                  <a>
                    <DinaMessage id="managedAttributesViews" />
                  </a>
                </Link>
                <Link href="/collection/material-sample/list">
                  <a>
                    <DinaMessage id="materialSampleListTitle" />
                  </a>
                </Link>
                <Link href="/collection/revisions-by-user">
                  <a>
                    <DinaMessage id="revisionsByUserPageTitle" />
                  </a>
                </Link>
                <Link href="/collection/storage-unit/list">
                  <a>
                    <DinaMessage id="storageUnitListTitle" />
                  </a>
                </Link>
                <Link href="/collection/material-sample-custom-view/list">
                  <a>
                    <DinaMessage id="workflowTemplates" />
                  </a>
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
                  <a>
                    <DinaMessage id="revisionsByUserPageTitle" />
                  </a>
                </Link>
                <Link href="/loan-transaction/transaction/list">
                  <a>
                    <DinaMessage id="transactions" />
                  </a>
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
                  <a>
                    <DinaMessage id="externalResourceListTitle" />
                  </a>
                </Link>
                <Link href="/object-store/object-subtype/list">
                  <a>
                    <DinaMessage id="objectSubtypeListTitle" />
                  </a>
                </Link>
                <Link href="/object-store/revisions-by-user">
                  <a>
                    <DinaMessage id="revisionsByUserPageTitle" />
                  </a>
                </Link>
                <Link href="/object-store/object/list">
                  <a>
                    <DinaMessage id="objectListTitle" />
                  </a>
                </Link>
                <Link href="/object-store/upload">
                  <a>
                    <DinaMessage id="uploadPageTitle" />
                  </a>
                </Link>
              </Stack>
            </Col>

            {/* Agents Links */}
            <Col className="mb-4">
              <h2>
                <DinaMessage id="agentsSectionTitle" />
              </h2>

              <Stack style={{ display: "inline-flex" }}>
                <Link href="/organization/list">
                  <a>
                    <DinaMessage id="organizationListTitle" />
                  </a>
                </Link>
                <Link href="/person/list">
                  <a>
                    <DinaMessage id="personListTitle" />
                  </a>
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
                  <a>
                    <SeqdbMessage id="indexSetListTitle" />
                  </a>
                </Link>
                <Link href="/seqdb/molecular-sample/list">
                  <a>
                    <SeqdbMessage id="molecularSampleListTitle" />
                  </a>
                </Link>
                <Link href="/seqdb/workflow/list">
                  <a>
                    <SeqdbMessage id="workflowListTitle" />
                  </a>
                </Link>
                <Link href="/seqdb/pcr-batch/list">
                  <a>
                    <SeqdbMessage id="pcrBatchListTitle" />
                  </a>
                </Link>
                <Link href="/seqdb/pcr-primer/list">
                  <a>
                    <SeqdbMessage id="pcrPrimerListTitle" />
                  </a>
                </Link>
                <Link href="/seqdb/product/list">
                  <a>
                    <SeqdbMessage id="productListTitle" />
                  </a>
                </Link>
                <Link href="/seqdb/region/list">
                  <a>
                    <SeqdbMessage id="regionListTitle" />
                  </a>
                </Link>
                <Link href="/seqdb/sanger-workflow/list">
                  <a>
                    <SeqdbMessage id="sangerWorkflowListTitle" />
                  </a>
                </Link>
                <Link href="/seqdb/pcr-profile/list">
                  <a>
                    <SeqdbMessage id="pcrProfileListTitle" />
                  </a>
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
                  <Link href="/collection/collection-method/list">
                    <a>
                      <DinaMessage id="collectionMethodListTitle" />
                    </a>
                  </Link>
                  <Link href="/collection/collection/list">
                    <a>
                      <DinaMessage id="collectionListTitle" />
                    </a>
                  </Link>
                  <Link href="/collection/managed-attributes-view/list">
                    <a>
                      <DinaMessage id="managedAttributesViews" />
                    </a>
                  </Link>
                  <Link href="/collection/extension/list">
                    <a>
                      <DinaMessage id="fieldExtensions" />
                    </a>
                  </Link>
                  <Link href="/collection/institution/list">
                    <a>
                      <DinaMessage id="institutionListTitle" />
                    </a>
                  </Link>
                  <Link href="/managed-attribute/list">
                    <a>
                      <DinaMessage id="managedAttributes" />
                    </a>
                  </Link>
                  <Link href="/object-store/object-subtype/list">
                    <a>
                      <DinaMessage id="objectSubtypeListTitle" />
                    </a>
                  </Link>
                  {/* Permissions link here */}
                  <Link href="/collection/preparation-type/list">
                    <a>
                      <DinaMessage id="preparationTypeListTitle" />
                    </a>
                  </Link>
                  <Link href="/collection/project/list">
                    <a>
                      <DinaMessage id="projectListTitle" />
                    </a>
                  </Link>
                  <Link href="/collection/protocol/list">
                    <a>
                      <DinaMessage id="protocolListTitle" />
                    </a>
                  </Link>
                  <Link href="/collection/storage-unit-type/list">
                    <a>
                      <DinaMessage id="storageUnitTypeListTitle" />
                    </a>
                  </Link>
                  {isAdmin && (
                    <Link href="/dina-user/list">
                      <a>
                        <DinaMessage id="userListTitle" />
                      </a>
                    </Link>
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
