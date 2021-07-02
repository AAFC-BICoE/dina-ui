import { ApiClientContext } from "common-ui";
import { createContext, useContext } from "react";
import { DinaForm } from "common-ui";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import Dropzone from "react-dropzone-uploader";

export default function UploadWorkbookPage() {
  const { formatMessage } = useDinaIntl();
  const { apiClient } = useContext(ApiClientContext);

  async function onSubmit(acceptedFile) {
    const formData = new FormData();
    formData.append("file", acceptedFile[0].file);

    const response = apiClient.axios.post(
      "/objectstore-api/conversion/workbook",
      formData
    );
  }

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
              onSubmit={onSubmit}
              multiple={false}
              maxFiles={1}
              accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            />
          </div>
        </main>
      </DinaForm>
      <Footer />
    </div>
  );
}
