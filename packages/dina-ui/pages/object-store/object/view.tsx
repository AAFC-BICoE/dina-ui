import {
  BackToListButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  LoadingSpinner,
  generateUUIDTree,
  FieldSet,
  QueryPage,
  BackButton
} from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMetadataViewQuery } from "../../../components/object-store/metadata/useMetadata";
import {
  Footer,
  Head,
  Nav,
  NotPubliclyReleasableWarning,
  TagsAndRestrictionsSection
} from "../../../components";
import { ExifView, MetadataDetails } from "../../../components/object-store";
import { MetadataFileView } from "../../../components/object-store/metadata/MetadataFileView";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { TableColumn } from "../../../../common-ui/lib/list-page/types";
import { Metadata } from "../../../../dina-ui/types/objectstore-api";

const OBJECT_DETAILS_PAGE_CSS = `
  .file-viewer-wrapper img {
    max-width: 100%;
    height: auto;
  }
`;

export interface MetadataViewPageProps {
  reloadLastSearch?: boolean;
}

export default function MetadataViewPage({
  reloadLastSearch
}: MetadataViewPageProps) {
  const router = useRouter();

  const uuid = String(router.query.id);

  const { loading, response } = useMetadataViewQuery(uuid);

  const preview = false;

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  if (response) {
    const metadata = response.data;
    const customViewQuery = metadata?.id
      ? generateUUIDTree(metadata?.id, "data.relationships.attachment.data.id")
      : undefined;

    // Columns for the elastic search list page.
    const columns: TableColumn<Metadata>[] = [
      // Material Sample Name
      {
        Cell: ({ original: { id, data } }) => (
          <Link
            href={`/collection/material-sample/view?id=${id}`}
            passHref={true}
          >
            <a>
              {data?.attributes?.materialSampleName ||
                data?.attributes?.dwcOtherCatalogNumbers?.join?.(", ") ||
                id}
            </a>
          </Link>
        ),
        label: "materialSampleName",
        accessor: "data.attributes.materialSampleName",
        isKeyword: true
      }
    ];

    const buttonBar = (
      <ButtonBar>
        <BackButton
          byPassView={true}
          className="me-auto"
          entityId={uuid}
          entityLink="/object-store/object"
          reloadLastSearch={reloadLastSearch ?? true}
        />
        <Link href={`/object-store/metadata/edit?id=${uuid}`}>
          <a className="btn btn-primary ms-auto" style={{ width: "10rem" }}>
            <DinaMessage id="editButtonText" />
          </a>
        </Link>
        <Link href={`/object-store/metadata/revisions?id=${uuid}`}>
          <a className="btn btn-info">
            <DinaMessage id="revisionsButtonText" />
          </a>
        </Link>
        <DeleteButton
          className="ms-5"
          id={uuid}
          options={{ apiBaseUrl: "/objectstore-api" }}
          postDeleteRedirect="/object-store/object/list?reloadLastSearch"
          type="metadata"
        />
      </ButtonBar>
    );

    return (
      <div>
        <Head title={metadata.originalFilename} />
        <Nav />
        <style>{OBJECT_DETAILS_PAGE_CSS}</style>
        <main className="container-fluid">
          {buttonBar}
          <div className="row">
            <div className="col-md-4">
              <MetadataFileView metadata={metadata} preview={preview} />
            </div>
            <div className="col-md-8">
              <div className="container">
                <DinaForm initialValues={metadata} readOnly={true}>
                  <NotPubliclyReleasableWarning />
                  <TagsAndRestrictionsSection
                    tagsFieldName="acTags"
                    groupSelectorName="bucket"
                  />
                  <MetadataDetails metadata={metadata} />
                  <ExifView objectUpload={metadata.objectUpload} />
                  {customViewQuery && (
                    <FieldSet
                      legend={<DinaMessage id="attachedMaterialSamples" />}
                    >
                      <QueryPage
                        columns={columns}
                        indexName={"dina_material_sample_index"}
                        viewMode={customViewQuery ? true : false}
                        customViewQuery={customViewQuery ?? undefined}
                        customViewFields={
                          customViewQuery
                            ? ["data.relationships.attachment.data.id"]
                            : undefined
                        }
                      />
                    </FieldSet>
                  )}
                </DinaForm>
              </div>
            </div>
          </div>
          {buttonBar}
        </main>
        <Footer />
      </div>
    );
  }

  return null;
}
