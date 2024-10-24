import { withRouter } from "next/router";
import PageLayout from "../../components/page/PageLayout";

export function WorkbookTemplateGenerator() {
  return (
    <PageLayout
      titleId="workbookGenerateTemplateTitle"
      buttonBarContent={<></>}
    >
      <></>
    </PageLayout>
  );
}

export default withRouter(WorkbookTemplateGenerator);
