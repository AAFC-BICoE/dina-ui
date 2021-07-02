import { DinaForm } from "common-ui";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import Dropzone from "react-dropzone-uploader";

export default function UploadWorkbookPage() {
  const { formatMessage } = useDinaIntl();

  // specify upload params and url for your files
  const getUploadParams = ({}) => {
    return { url: "" };
  };

  // receives array of files that are done uploading when submit button is clicked
  const handleSubmit = allFiles => {
    allFiles.forEach(f => f.remove());
  };

  return (
    <div>
      <Head title={formatMessage("workbookGroupUploadTitle")} />
      <Nav />
      <DinaForm initialValues={{ defaultValuesConfig: null }}>
        <main role="main">
          <div className="container">
            <h1>
              <DinaMessage id="workbookGroupUploadTitle" />
            </h1>

            <Dropzone
              getUploadParams={getUploadParams}
              multiple={false}
              maxFiles={1}
              onSubmit={handleSubmit}
              accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            />
          </div>
        </main>
      </DinaForm>
      <Footer />
    </div>
  );
}
