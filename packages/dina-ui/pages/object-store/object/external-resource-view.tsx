import {
  BackToListButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  LoadingSpinner
} from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMetadataViewQuery } from "../../../components/object-store/metadata/useMetadata";
import { Footer, Head, Nav } from "../../../components";
import { MetadataDetails } from "../../../components/object-store";
import { DinaMessage } from "../../../intl/dina-ui-intl";

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
      <ButtonBar>
        <BackToListButton entityLink="/object-store/object" />
        <Link href={`/object-store/metadata/external-resource-edit?id=${id}`}>
          <a className="btn btn-primary ms-auto" style={{ width: "10rem" }}>
            <DinaMessage id="editButtonText" />
          </a>
        </Link>
        <Link
          href={`/object-store/metadata/revisions?id=${id}&isExternalResourceMetadata=true`}
        >
          <a className="btn btn-info">
            <DinaMessage id="revisionsButtonText" />
          </a>
        </Link>
        <DeleteButton
          className="ms-5"
          id={id}
          options={{ apiBaseUrl: "/objectstore-api" }}
          postDeleteRedirect="/object-store/object/list"
          type="metadata"
        />
      </ButtonBar>
    );

    return (
      <div>
        <Head title={metadata.originalFilename} />
        <Nav />
        <main className="container-fluid">
          {buttonBar}
          <div className="container">
            <DinaForm initialValues={metadata} readOnly={true}>
              <MetadataDetails metadata={metadata} />
            </DinaForm>
          </div>
          {buttonBar}
        </main>
        <Footer />
      </div>
    );
  }

  return null;
}
