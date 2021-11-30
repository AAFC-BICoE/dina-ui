import { ButtonBar, DinaForm, FormikButton, useApiClient } from "common-ui";
import { FormikProps } from "formik";
import { InputResource, PersistedResource } from "kitsu";
import { compact } from "lodash";
import { useRouter } from "next/router";
import { useMemo, useRef, useState } from "react";
import { Promisable } from "type-fest";
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

interface MaterialSampleBulkEditorProps {
  samples: InputResource<MaterialSample>[];
  onSaved: (samples: PersistedResource<MaterialSample>[]) => Promisable<void>;
}

function MaterialSampleBulkEditor({
  samples: samplesProp,
  onSaved
}: MaterialSampleBulkEditorProps) {
  // Make sure the samples list doesn't change during this component's lifecycle:
  const samples = useMemo(() => samplesProp, []);

  const sampleSaveHooks = samples.map(sample =>
    useMaterialSampleSave({ materialSample: sample })
  );

  const sampleFormRefs = samples.map(() =>
    useRef<FormikProps<InputResource<MaterialSample>>>(null)
  );

  const { save } = useApiClient();

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

    const validOperations = saveOperations.map(op => {
      if (!op) {
        throw new Error("Some material sample saves failed.");
      }
      return op;
    });

    const savedSamples = await save<MaterialSample>(validOperations, {
      apiBaseUrl: "/collection-api"
    });

    await onSaved(savedSamples);
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
