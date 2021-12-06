import { InputResource, PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  Head,
  MaterialSampleBulkEditor,
  MaterialSampleGenerationForm,
  Nav
} from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api/resources/MaterialSample";

export default function MaterialSampleBulkCreatePage() {
  const { formatMessage } = useDinaIntl();
  const router = useRouter();

  const splitFromId = router.query.splitFromId?.toString();

  const title = "createNewMaterialSamples";

  const [generatedSamples, setGeneratedSamples] = useState<
    InputResource<MaterialSample>[] | null
  >(null);

  async function moveToResultPage(
    samples: PersistedResource<MaterialSample>[]
  ) {
    const ids = samples.map(it => it.id).join(",");
    await router.push({
      pathname: "/collection/material-sample/bulk-result",
      query: { parentSampleId: splitFromId, ids, actionType: "created" }
    });
  }

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className={generatedSamples ? "container-fluid" : "container"}>
        <h1 id="wb-cont">{formatMessage(title)}</h1>
        {generatedSamples ? (
          <MaterialSampleBulkEditor
            disableSampleNameField={true}
            samples={generatedSamples}
            onSaved={moveToResultPage}
          />
        ) : (
          <MaterialSampleGenerationForm
            onGenerate={setGeneratedSamples}
            parentId={splitFromId}
          />
        )}
      </main>
    </div>
  );
}
