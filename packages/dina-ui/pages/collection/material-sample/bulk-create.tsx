import { PersistedResource } from "kitsu";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { useState } from "react";
import {
  Head,
  MaterialSampleBulkEditor,
  MaterialSampleGenerationForm,
  MaterialSampleGenerationFormSubmission,
  Nav
} from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api/resources/MaterialSample";

export function MaterialSampleBulkCreatePage({ router }: WithRouterProps) {
  const { formatMessage } = useDinaIntl();

  const [mode, setMode] = useState<"GENERATE" | "EDIT">("GENERATE");
  const [lastSubmission, setLastSubmission] =
    useState<MaterialSampleGenerationFormSubmission>();

  const splitFromId = router.query.splitFromId?.toString();

  const title = "createNewMaterialSamples";

  const generatedSamples = lastSubmission?.samples;

  async function moveToResultPage(
    samples: PersistedResource<MaterialSample>[]
  ) {
    const ids = samples.map(it => it.id).join(",");
    await router.push({
      pathname: "/collection/material-sample/bulk-result",
      query: { parentSampleId: splitFromId, ids, actionType: "created" }
    });
  }

  function onGenerate(submission: MaterialSampleGenerationFormSubmission) {
    setLastSubmission(submission);
    setMode("EDIT");
  }

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className={mode === "EDIT" ? "container-fluid" : "container"}>
        <h1 id="wb-cont">{formatMessage(title)}</h1>
        {mode === "EDIT" && generatedSamples && (
          <MaterialSampleBulkEditor
            disableSampleNameField={true}
            samples={generatedSamples}
            onSaved={moveToResultPage}
            onPreviousClick={() => setMode("GENERATE")}
          />
        )}
        {mode === "GENERATE" && (
          <MaterialSampleGenerationForm
            onGenerate={onGenerate}
            parentId={splitFromId}
            initialValues={lastSubmission?.submittedValues}
            initialMode={lastSubmission?.generationMode}
          />
        )}
      </main>
    </div>
  );
}

export default withRouter(MaterialSampleBulkCreatePage);
