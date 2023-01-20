import { InputResource, PersistedResource } from "kitsu";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { useState } from "react";
import { writeStorage } from "@rehooks/local-storage";
import { MaterialSampleBulkEditor } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api/resources/MaterialSample";
import { BULK_EDIT_RESULT_IDS_KEY } from "./bulk-edit";
import { MaterialSampleSplitGenerationForm } from "../../../components/bulk-material-sample/MaterialSampleSplitGenerationForm";
import PageLayout from "../../../components/page/PageLayout";

export function MaterialSampleBulkSplitPage({ router }: WithRouterProps) {
  const { formatMessage } = useDinaIntl();

  const [mode, setMode] = useState<"GENERATE" | "EDIT">("GENERATE");
  const [lastSubmission, setLastSubmission] =
    useState<InputResource<MaterialSample>[]>();

  const splitFromId = router.query.splitFromId?.toString();

  const title = "splitSubsampleTitle";

  async function moveToResultPage(
    samples: PersistedResource<MaterialSample>[]
  ) {
    writeStorage(
      BULK_EDIT_RESULT_IDS_KEY,
      samples.map((it) => it.id)
    );

    await router.push({
      pathname: "/collection/material-sample/bulk-result",
      query: { actionType: "created" }
    });
  }

  function onGenerate(submission: InputResource<MaterialSample>[]) {
    setLastSubmission(submission);
    setMode("EDIT");
  }

  return (
    <>
      {mode === "EDIT" && lastSubmission && (
        <PageLayout titleId="splitSubsampleTitle">
          <MaterialSampleBulkEditor
            disableSampleNameField={true}
            samples={lastSubmission}
            onSaved={moveToResultPage}
            onPreviousClick={() => setMode("GENERATE")}
          />
        </PageLayout>
      )}
      {mode === "GENERATE" && (
        <MaterialSampleSplitGenerationForm onGenerate={onGenerate} />
      )}
    </>
  );
}

export default withRouter(MaterialSampleBulkSplitPage);
