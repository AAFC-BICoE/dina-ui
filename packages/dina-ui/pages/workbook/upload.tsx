import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { WorkbookUploader } from "../../components/workbook/WorkbookUploader";
import { WorkbookDisplay } from "../../components/workbook/WorkbookDisplay";
import { ApiClientContext, LoadingSpinner } from "common-ui";
import { useContext } from "react";
import { render } from "enzyme";

export default function UploadWorkbookPage() {
  const { apiClient } = useContext(ApiClientContext);
  const { formatMessage } = useDinaIntl();

  let tableData = "";
  let loading = false;

  function onSubmit(acceptedFile) {
    const formData = new FormData();
    formData.append("file", acceptedFile[0].file);

    // Retrieve the JSON to display on the workbook page.
    loading = true;
    apiClient.axios
      .post("/objectstore-api/conversion/workbook", formData)
      .then(response => {
        tableData = response.data;
      });
  }

  if (loading) {
    return <LoadingSpinner loading={true} />;
  } else {
    return (
      <div>
        <Head title={formatMessage("workbookGroupUploadTitle")} />
        <Nav />
        <div className="container">
          <h1>
            <DinaMessage id="workbookGroupUploadTitle" />
          </h1>
          <WorkbookUploader onSubmit={onSubmit} />
          <WorkbookDisplay />
        </div>
        <Footer />
      </div>
    );
  }
}
