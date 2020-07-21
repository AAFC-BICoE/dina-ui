import { useQuery, withResponse } from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { Head, Nav, Footer } from "../../../components";
import { MetadataManagedAttributes } from "../../../components/metadata/MetadataDetails";
import { ReferenceLink } from "../../../components/revisions/ReferenceLink";
import { RevisionsPageLayout } from "../../../components/revisions/RevisionsPageLayout";
import { useDinaIntl, DinaMessage } from "../../../intl/dina-ui-intl";
import { Metadata, Person } from "../../../types/objectstore-api";
import { ComponentType } from "enzyme";
import { CellInfo } from "react-table";

export default function MetadataRevisionListPage() {
  const { formatMessage } = useDinaIntl();

  const router = useRouter();
  const { id: metadataId } = router.query;

  const metadataQuery = useQuery<Metadata>({
    path: `objectstore-api/metadata/${metadataId}`
  });

  return withResponse(metadataQuery, response => {
    const metadata = response.data;

    const pageTitle = formatMessage("metadataRevisionsListTitle", {
      name: metadata.originalFilename
    });

    return (
      <>
        <Head title={pageTitle} />
        <Nav />
        <div className="container-fluid">
          <h1>{pageTitle}</h1>
          <div className="form-group">
            <Link href={`/object-store/object/view?id=${metadata.id}`}>
              <a>
                <DinaMessage id="metadataDetailsPageLink" />
              </a>
            </Link>
          </div>
          <RevisionsPageLayout
            auditSnapshotPath="objectstore-api/audit-snapshot"
            instanceId={`metadata/${metadataId}`}
            customValueCells={customValueCells}
          />
        </div>
        <Footer />
      </>
    );
  });
}

/** Custom renderers for complex cell values. */
const customValueCells: Record<string, ComponentType<CellInfo>> = {
  // Link to the original metadata:
  acDerivedFrom: ({ original: { value: instanceId } }) => {
    return (
      <ReferenceLink<Metadata>
        baseApiPath="objectstore-api"
        instanceId={instanceId}
        link={({ id, originalFilename }) => (
          <Link href={`/object/view?id=${id}`}>
            <a>{originalFilename}</a>
          </Link>
        )}
      />
    );
  },
  // Link to the Metadata creator:
  acMetadataCreator: ({ original: { value: cdoId } }) => {
    return (
      cdoId && (
        <ReferenceLink<Person>
          baseApiPath="agent-api"
          instanceId={{ typeName: "person", cdoId }}
          link={({ displayName }) => <span>{displayName}</span>}
        />
      )
    );
  },
  // Link to the doc creator:
  dcCreator: ({ original: { value: cdoId } }) => {
    return (
      cdoId && (
        <ReferenceLink<Person>
          baseApiPath="agent-api"
          instanceId={{ typeName: "person", cdoId }}
          link={({ displayName }) => <span>{displayName}</span>}
        />
      )
    );
  },
  // Show the entire value of the metadata map in a key-value table:
  managedAttributeMap: ({ original: { value } }) => (
    <MetadataManagedAttributes managedAttributeMap={value} />
  )
};
