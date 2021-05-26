import {
  BackToListButton,
  ButtonBar,
  DeleteButton,
  EditButton,
  LoadingSpinner
} from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import {
  ExifView,
  FileView,
  MetadataDetails,
  useMetadataQuery
} from "../../../components/object-store";
import { MetadataFileView } from "../../../components/object-store/metadata/MetadataFileView";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { Metadata } from "../../../types/objectstore-api";

const OBJECT_DETAILS_PAGE_CSS = `
  .file-viewer-wrapper img {
    max-width: 100%;
    height: auto;
  }
`;

export default function MetadataViewPage() {
  const router = useRouter();

  const id = String(router.query.id);

  const { loading, response } = useMetadataQuery(id);

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  if (response) {
    const metadata = response.data;

    const buttonBar = (
      <ButtonBar>
        <BackToListButton entityLink="/object-store/object" />
        <Link href={`/object-store/metadata/single-record-edit?id=${id}`}>
          <a className="btn btn-primary ms-auto" style={{ width: "10rem" }}>
            <DinaMessage id="editButtonText" />
          </a>
        </Link>
        <Link href={`/object-store/metadata/revisions?id=${id}`}>
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
        <style>{OBJECT_DETAILS_PAGE_CSS}</style>
        <main className="container-fluid">
          {buttonBar}
          <div className="row">
            <div className="col-md-4">
              <MetadataFileView metadata={metadata} />
            </div>
            <div className="col-md-8">
              <div className="container">
                <div className="mb-3">
                  <Link
                    href={`/object-store/metadata/single-record-edit?id=${id}`}
                  >
                    <a className="btn btn-primary">
                      <DinaMessage id="editButtonText" />
                    </a>
                  </Link>
                </div>
                <MetadataDetails metadata={metadata} />
                <ExifView objectUpload={metadata.objectUpload} />
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
