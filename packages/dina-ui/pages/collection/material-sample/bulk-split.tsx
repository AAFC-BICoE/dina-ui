import { InputResource, PersistedResource } from "kitsu";
import { useState, useEffect } from "react";
import { writeStorage } from "@rehooks/local-storage";
import { MaterialSampleBulkEditor } from "../../../components";
import { MaterialSample } from "../../../types/collection-api/resources/MaterialSample";
import { BULK_EDIT_RESULT_IDS_KEY } from "./bulk-edit";
import { MaterialSampleSplitGenerationForm } from "../../../components/bulk-material-sample/MaterialSampleSplitGenerationForm";
import PageLayout from "../../../components/page/PageLayout";
import { useLocalStorage } from "@rehooks/local-storage";
import { useRouter } from "next/router";
import { BULK_SPLIT_IDS, LoadingSpinner, useQuery } from "common-ui/lib";
import { FormTemplate } from "../../../types/collection-api";

export default function MaterialSampleBulkSplitPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"GENERATE" | "EDIT">("GENERATE");
  const [lastSubmission, setLastSubmission] =
    useState<InputResource<MaterialSample>[]>();

  const [ids] = useLocalStorage<string[]>(BULK_SPLIT_IDS, []);

  const formTemplateId = router.query.splitConfiguration;

  const formTemplateQuery = useQuery<FormTemplate>(
    {
      path: `collection-api/form-template/${formTemplateId}`
    },
    {
      disabled: !formTemplateId
    }
  );

  // Clear local storage once the ids have been retrieved.
  useEffect(() => {
    if (ids.length === 0) {
      router.push("/collection/material-sample/list");
    }

    // Clear the local storage.
    localStorage.removeItem(BULK_SPLIT_IDS);
  }, [ids]);

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

  if (!formTemplateQuery.isDisabled && formTemplateQuery.loading) {
    return <LoadingSpinner loading={true} />;
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
        <MaterialSampleSplitGenerationForm
          onGenerate={onGenerate}
          ids={ids}
          splitConfiguration={formTemplateQuery.response?.data}
        />
      )}
    </>
  );
}
