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
import { SplitConfiguration } from "../../../types/collection-api/resources/SplitConfiguration";
import { getSplitConfigurationComponentValues } from "../../../components/form-template/formTemplateUtils";

export default function MaterialSampleBulkSplitPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"GENERATE" | "EDIT">("GENERATE");
  const [lastSubmission, setLastSubmission] =
    useState<InputResource<MaterialSample>[]>();
  const [splitConfiguration, setSplitConfiguration] =
    useState<SplitConfiguration>();

  const [ids] = useLocalStorage<string[]>(BULK_SPLIT_IDS, []);

  const formTemplateId: string = router.query.splitConfiguration as string;

  const formTemplateQuery = useQuery<FormTemplate>(
    {
      path: `collection-api/form-template/${formTemplateId}`
    },
    {
      disabled: !formTemplateId,
      onSuccess: (response) => {
        setSplitConfiguration(
          getSplitConfigurationComponentValues(response.data)
            ?.splitConfiguration
        );
      }
    }
  );

  // Clear local storage once the ids have been retrieved.
  useEffect(() => {
    if (ids.length === 0) {
      router.push("/collection/material-sample/list");
    }
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

  if (
    !formTemplateQuery.isDisabled &&
    formTemplateQuery.loading &&
    !splitConfiguration
  ) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <>
      {/* Bulk Edit Mode */}
      {mode === "EDIT" && lastSubmission && (
        <PageLayout titleId="splitSubsampleTitle">
          <MaterialSampleBulkEditor
            disableSampleNameField={true}
            samples={lastSubmission}
            onSaved={moveToResultPage}
            onPreviousClick={() => setMode("GENERATE")}
            initialFormTemplateUUID={formTemplateId}
          />
        </PageLayout>
      )}

      {/* Generate identifiers */}
      {mode === "GENERATE" && (
        <MaterialSampleSplitGenerationForm
          onGenerate={onGenerate}
          ids={ids}
          splitConfiguration={splitConfiguration}
        />
      )}
    </>
  );
}
