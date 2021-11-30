import { InputResource } from "kitsu";
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

  const title = "createNewMaterialSamples";

  const [generatedSamples, setGeneratedSamples] = useState<
    InputResource<MaterialSample>[] | null
  >(null);

  async function moveToListPage() {
    await router.push(`/collection/material-sample/list`);
  }

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container">
        <h1 id="wb-cont">{formatMessage(title)}</h1>
        {generatedSamples ? (
          <MaterialSampleBulkEditor
            samples={generatedSamples}
            onSaved={moveToListPage}
          />
        ) : (
          <MaterialSampleGenerationForm onGenerate={setGeneratedSamples} />
        )}
      </main>
    </div>
  );
}
