import { MaterialSample } from "packages/dina-ui/types/collection-api/resources/MaterialSample";
import { useState } from "react";
import { Head, MaterialSampleGenerationForm, Nav } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";

export default function MaterialSampleBulkCreatePage() {
  const { formatMessage } = useDinaIntl();

  const title = "createNewMaterialSamples";

  const [generatedSamples, setGeneratedSamples] = useState<
    Partial<MaterialSample>[] | null
  >(null);

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container">
        <h1 id="wb-cont">{formatMessage(title)}</h1>
        <MaterialSampleGenerationForm onGenerate={setGeneratedSamples} />
      </main>
    </div>
  );
}
