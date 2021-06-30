import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
// import { FileUploader } from "../../components/object-store";

export default function UploadWorkbookPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("workbookGroupUploadTitle")} />
      <Nav />
      <main role="main">
        <div className="container">
          <h1>
            <DinaMessage id="workbookGroupUploadTitle" />
          </h1>
        </div>
      </main>
      <Footer />
    </div>
  );
}
