import { ButtonBar, DinaForm, FormikButton } from "common-ui";
import { FormikProps } from "formik";
import { InputResource } from "kitsu";
import { useMemo, useRef, useState } from "react";
import {
  Head,
  MaterialSampleBulkNavigator,
  MaterialSampleGenerationForm,
  Nav
} from "../../../components";
import { useMaterialSampleSave } from "../../../components/collection";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api/resources/MaterialSample";
import { MaterialSampleForm } from "./edit";

export default function MaterialSampleBulkCreatePage() {
  const { formatMessage } = useDinaIntl();

  const title = "createNewMaterialSamples";

  const [generatedSamples, setGeneratedSamples] = useState<
    InputResource<MaterialSample>[] | null
  >(null);

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container">
        <h1 id="wb-cont">{formatMessage(title)}</h1>
        {generatedSamples ? (
          <MaterialSampleBulkEditor samples={generatedSamples} />
        ) : (
          <MaterialSampleGenerationForm onGenerate={setGeneratedSamples} />
        )}
      </main>
    </div>
  );
}

interface MaterialSampleBulkEditorProps {
  samples: InputResource<MaterialSample>[];
}

function MaterialSampleBulkEditor({
  samples: samplesProp
}: MaterialSampleBulkEditorProps) {
  // Make sure the samples list doesn't change during this component's lifecycle:
  const samples = useMemo(() => samplesProp, []);

  const sampleSaveHooks = samples.map(sample =>
    useMaterialSampleSave({ materialSample: sample })
  );

  const sampleFormRefs = samples.map(() =>
    useRef<FormikProps<InputResource<MaterialSample>>>(null)
  );

  async function saveAll() {
    const saveOperations = await Promise.all(
      samples.map((sample, index) => {
        const formik = sampleFormRefs[index].current;
        const saveHook = sampleSaveHooks[index];
        if (!formik) {
          throw new Error(
            `Missing Formik ref for sample ${sample.materialSampleName}`
          );
        }
        if (!saveHook) {
          throw new Error(
            `Missing Save Hook for sample ${sample.materialSampleName}`
          );
        }

        return saveHook.prepareSampleSaveOperation(formik.values, formik);
      })
    );

    // console.log({ saveOperations });
  }

  return (
    <div>
      <DinaForm initialValues={{}}>
        <ButtonBar>
          <FormikButton className="btn btn-primary ms-auto" onClick={saveAll}>
            <DinaMessage id="saveAll" />
          </FormikButton>
        </ButtonBar>
      </DinaForm>
      <MaterialSampleBulkNavigator
        samples={samples}
        renderOneSample={(_, index) => (
          <MaterialSampleForm
            materialSampleFormRef={sampleFormRefs[index]}
            materialSampleSaveHook={sampleSaveHooks[index]}
            buttonBar={() => null}
            disableAutoNamePrefix={true}
          />
        )}
      />
    </div>
  );
}
