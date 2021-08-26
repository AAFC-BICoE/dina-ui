import Link from "next/link";
import React from "react";
import { Footer, Head, Nav } from "../components";
import { DinaMessage } from "../intl/dina-ui-intl";
import { SeqdbMessage } from "../intl/seqdb-intl";

const Home: React.FunctionComponent = () => (
  <div>
    <Head title="Home" />

    <Nav />
    <main role="main">
      <div className="container">
        <h1 id="wb-cont">
          <DinaMessage id="dinaHomeH1" />
        </h1>
        <h2>
          <DinaMessage id="objectStoreTitle" />
        </h2>
        <ul>
          <li>
            <Link href="/object-store/upload">
              <a>
                <DinaMessage id="uploadPageTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/object-store/object/list">
              <a>
                <DinaMessage id="objectListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/object-store/managedAttributesView/listView">
              <a>
                <DinaMessage id="managedAttributeListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/object-store/object-subtype/list">
              <a>
                <DinaMessage id="objectSubtypeListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/object-store/revisions-by-user">
              <a>
                <DinaMessage id="revisionsByUserPageTitle" />
              </a>
            </Link>
          </li>
        </ul>
        <h2>
          <DinaMessage id="agentsSectionTitle" />
        </h2>
        <ul>
          <li>
            <Link href="/person/list">
              <a>
                <DinaMessage id="personListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/organization/list">
              <a>
                <DinaMessage id="organizationListTitle" />
              </a>
            </Link>
          </li>
        </ul>
        <h2>
          <SeqdbMessage id="seqdbTitle" />
        </h2>
        <ul>
          <li>
            <Link href="/seqdb/workflow/list">
              <a>
                <SeqdbMessage id="workflowListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/seqdb/index-set/list">
              <a>
                <SeqdbMessage id="indexSetListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/seqdb/pcr-primer/list">
              <a>
                <SeqdbMessage id="pcrPrimerListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/seqdb/pcr-profile/list">
              <a>
                <SeqdbMessage id="pcrProfileListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/seqdb/pcr-batch/list">
              <a>
                <SeqdbMessage id="pcrBatchListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/seqdb/product/list">
              <a>
                <SeqdbMessage id="productListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/seqdb/protocol/list">
              <a>
                <SeqdbMessage id="protocolListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/seqdb/region/list">
              <a>
                <SeqdbMessage id="regionListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/seqdb/molecular-sample/list">
              <a>
                <SeqdbMessage id="molecularSampleListTitle" />
              </a>
            </Link>
          </li>
        </ul>
        <h2>
          <DinaMessage id="collectionSectionTitle" />
        </h2>
        <ul>
          <li className="d-none">
            <Link href="/collection/collector-group/list">
              <a>
                <DinaMessage id="collectorGroupListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/collection/collection/list">
              <a>
                <DinaMessage id="collectionListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/collection/collection-method/list">
              <a>
                <DinaMessage id="collectionMethodListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/collection/collecting-event/list">
              <a>
                <DinaMessage id="collectingEventListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/collection/managed-attribute/list">
              <a>
                <DinaMessage id="managedAttributeListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/collection/material-sample/list">
              <a>
                <DinaMessage id="materialSampleListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/collection/material-sample-type/list">
              <a>
                <DinaMessage id="materialSampleTypeListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/collection/preparation-type/list">
              <a>
                <DinaMessage id="preparationTypeListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/collection/storage-unit-type/list">
              <a>
                <DinaMessage id="storageUnitTypeListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/collection/storage-unit/list">
              <a>
                <DinaMessage id="storageUnitListTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/collection/revisions-by-user">
              <a>
                <DinaMessage id="revisionsByUserPageTitle" />
              </a>
            </Link>
          </li>
          <li>
            <Link href="/collection/workflow-template/list">
              <a>
                <DinaMessage id="workflowTemplateListTitle" />
              </a>
            </Link>
          </li>
        </ul>
        <h2>
          <DinaMessage id="workbookTitle" />
        </h2>
        <ul>
          <li>
            <Link href="/workbook/upload">
              <a>
                <DinaMessage id="workbookGroupUploadTitle" />
              </a>
            </Link>
          </li>
        </ul>
      </div>
    </main>
    <Footer />
  </div>
);

export default Home;
