import { MaterialSample } from "packages/dina-ui/types/collection-api/resources/MaterialSample";
import { ReactNode, useState } from "react";
import {
  Head,
  MaterialSampleBulkNavigator,
  MaterialSampleGenerationForm,
  Nav
} from "../../../components";
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
        {generatedSamples ? (
          <MaterialSampleBulkNavigator
            samples={generatedSamples}
            renderOneSample={sample =>
              `TODO sample form goes here: ${sample.materialSampleName}`
            }
          />
        ) : (
          <MaterialSampleGenerationForm onGenerate={setGeneratedSamples} />
        )}
      </main>
    </div>
  );
}

export interface MaterialSampleBulkNavigatorProps {
  samples: Partial<MaterialSample>[];
  renderOneSample: (sample: Partial<MaterialSample>) => ReactNode;
}
