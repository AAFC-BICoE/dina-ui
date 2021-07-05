import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

export default function DisplayWorkbook() {
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
