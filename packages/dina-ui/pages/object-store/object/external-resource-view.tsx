import {
  BackToListButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  LoadingSpinner,
  UploadDerivativeButton
} from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMetadataViewQuery } from "../../../components/object-store/metadata/useMetadata";
import { Footer, Head, Nav, TagSelectReadOnly } from "../../../components";
import { MetadataDetails } from "../../../components/object-store";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { MetadataFileView } from "../../../components/object-store/metadata/MetadataFileView";

export default function ExternalResourceMetadataViewPage() {
  const router = useRouter();

  const id = String(router.query.id);

  const { loading, response } = useMetadataViewQuery(id);

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  if (response) {
    const metadata = response.data;

    const buttonBar = (
      <ButtonBar className="mb-3">
        <div className="col-md-3">
          <BackToListButton entityLink="/object-store/object" />
        </div>
        <div className="col-md-9 flex d-flex gap-2">
          <Link
            href={`/object-store/metadata/external-resource-edit?id=${id}`}
            className="btn btn-primary ms-auto"
            style={{ width: "10rem" }}
          >
            <DinaMessage id="editButtonText" />
          </Link>
          <UploadDerivativeButton acDerivedFrom={id} />
          <Link
            href={`/object-store/metadata/revisions?id=${id}&isExternalResourceMetadata=true`}
            className="btn btn-info"
          >
            <DinaMessage id="revisionsButtonText" />
          </Link>
          <DeleteButton
            className="ms-5"
            id={id}
            options={{ apiBaseUrl: "/objectstore-api" }}
            postDeleteRedirect="/object-store/object/list"
            type="metadata"
          />
        </div>
      </ButtonBar>
    );

    return (
      <div>
        <Head title={metadata.originalFilename} />
        <Nav marginBottom={false} />
        {buttonBar}
        <main className="container-fluid">
          <DinaForm initialValues={metadata} readOnly={true}>
            {metadata.derivatives && (
              <MetadataFileView metadata={metadata} imgHeight="15rem" />
            )}
            <TagSelectReadOnly tagsFieldName="acTags" />
            <MetadataDetails metadata={metadata} />
          </DinaForm>
        </main>
        <Footer />
      </div>
    );
  }

  return null;
}
