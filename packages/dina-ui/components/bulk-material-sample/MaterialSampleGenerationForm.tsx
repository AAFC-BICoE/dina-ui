import {
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  NumberSpinnerField,
  SelectField,
  SubmitButton,
  TextField
} from "common-ui";
import { Field, FormikContextType } from "formik";
import { InputResource } from "kitsu";
import { padStart, range } from "lodash";
import { MaterialSample } from "../../types/collection-api/resources/MaterialSample";
import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import SpreadSheetColumn from "spreadsheet-column";
import * as yup from "yup";
import { CollectionSelectField } from "..";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

export interface MaterialSampleGenerationFormProps {
  onGenerate: (samples: InputResource<MaterialSample>[]) => void;
}

export function MaterialSampleGenerationForm({
  onGenerate
}: MaterialSampleGenerationFormProps) {
  const [generationMode, setGenerationMode] = useState<GenerationMode>("BATCH");
  const { formatMessage } = useDinaIntl();

  const onSubmit: DinaFormOnSubmit<GeneratorFormValues> = ({
    submittedValues
  }) => {
    const samples = [...Array(Number(submittedValues.numberToCreate))].map<
      InputResource<MaterialSample>
    >((_, index) => ({
      type: "material-sample",
      materialSampleName: generateName({
        generationMode,
        index,
        formState: submittedValues
      }),
      ...submittedValues.samples[index],
      collection: submittedValues.collection
    }));

    onGenerate(samples);
  };

  return (
    <DinaForm<Partial<GeneratorFormValues>>
      initialValues={{
        numberToCreate: 0,
        samples: [],
        increment: "NUMERICAL",
        suffix: "",
        start: "001",
        baseName: "",
        separator: ""
      }}
      horizontal="flex"
      validationSchema={generatorFormSchema}
      onSubmit={onSubmit}
    >
      <div style={{ width: "25rem" }}>
        <NumberSpinnerField
          name="numberToCreate"
          max={30}
          label={formatMessage("materialSamplesToCreate")}
        />
      </div>
      <Tabs
        selectedIndex={GENERATION_MODES.indexOf(generationMode)}
        onSelect={index => setGenerationMode(GENERATION_MODES[index])}
      >
        <TabList>
          <Tab className="react-tabs__tab batch-tab">
            <DinaMessage id="generateBatch" />
          </Tab>
          <Tab className="react-tabs__tab series-tab">
            <DinaMessage id="generateSeries" />
          </Tab>
        </TabList>
        <TabPanel>
          <GeneratorFields generationMode={generationMode} />
          <PreviewAndCustomizeFields generationMode={generationMode} />
        </TabPanel>
        <TabPanel>
          <GeneratorFields generationMode={generationMode} />
          <PreviewAndCustomizeFields generationMode={generationMode} />
        </TabPanel>
      </Tabs>
      <ButtonBar>
        <SubmitButton
          className="ms-auto"
          buttonProps={(form: FormikContextType<GeneratorFormValues>) => ({
            disabled: !form.values.numberToCreate
          })}
        />
      </ButtonBar>
    </DinaForm>
  );
}

export const GENERATION_MODES = ["BATCH", "SERIES"] as const;
export type GenerationMode = typeof GENERATION_MODES[number];

export const INCREMENT_MODES = ["NUMERICAL", "LETTER"] as const;
export type IncrementMode = typeof INCREMENT_MODES[number];

interface GeneratorFieldsProps {
  generationMode: GenerationMode;
}

function GeneratorFields({ generationMode }: GeneratorFieldsProps) {
  const SUFFIX_TYPE_OPTIONS = INCREMENT_MODES.map(mode => ({
    label: mode,
    value: mode
  }));

  const suffixAndSeparatorFields = (
    <>
      <TextField name="suffix" className="col-md-3" />
      <TextField name="separator" className="col-md-3" />
    </>
  );

  return (
    <div>
      <h4>
        <DinaMessage id="primaryId" />
      </h4>
      <div className="row">
        <CollectionSelectField className="col-sm-6" name="collection" />
        {generationMode === "BATCH" && suffixAndSeparatorFields}
        {generationMode === "SERIES" && (
          <>
            <SelectField
              className="col-md-3"
              name="increment"
              options={SUFFIX_TYPE_OPTIONS}
              onChange={(newType, formik) => {
                // Set the default suffix:
                formik.setFieldValue(
                  "start",
                  newType === "NUMERICAL" ? "001" : "A"
                );
              }}
            />
            <Field name="increment">
              {({ field: { value: increment } }) => (
                <TextField
                  className="col-md-3"
                  // Select all text on click:
                  inputProps={{
                    onClick: e => (e.target as any).select()
                  }}
                  name="start"
                  numberOnly={increment === "NUMERICAL"}
                  letterOnly={increment === "LETTER"}
                />
              )}
            </Field>
          </>
        )}
      </div>
      <div className="row">
        <TextField className="col-sm-6" name="baseName" />
        {generationMode === "SERIES" && suffixAndSeparatorFields}
      </div>
    </div>
  );
}

function PreviewAndCustomizeFields({ generationMode }: GeneratorFieldsProps) {
  return (
    <div>
      <h4>
        <DinaMessage id="previewAndCustomizeLabel" />
      </h4>
      {generationMode === "BATCH" && (
        <p>
          <DinaMessage id="batchModeInfo" />
        </p>
      )}
      {generationMode === "SERIES" && (
        <p>
          <DinaMessage id="seriesModeInfo" />
        </p>
      )}
      <ul className="list-group">
        <Field>
          {({ form: { values } }) => {
            const formState: Partial<GeneratorFormValues> = values;

            if (!formState.numberToCreate) {
              return null;
            }

            return range(0, formState.numberToCreate).map(index => {
              const placeholder = generateName({
                index,
                generationMode,
                formState
              });

              return (
                <li
                  key={`${index}-${placeholder}`}
                  className="list-group-item d-flex align-items-center"
                  style={{
                    backgroundColor: index % 2 === 0 ? "#f2f2f2" : undefined
                  }}
                >
                  <div className="me-3 fw-bold">{`#${index + 1}:`}</div>
                  <div style={{ width: "20rem" }}>
                    <TextField
                      name={`samples[${index}].materialSampleName`}
                      removeLabel={true}
                      removeBottomMargin={true}
                      placeholder={placeholder}
                    />
                  </div>
                </li>
              );
            });
          }}
        </Field>
      </ul>
    </div>
  );
}

interface GenerateNameParams {
  index: number;
  generationMode: GenerationMode;
  formState: Partial<GeneratorFormValues>;
}

function generateName(params: GenerateNameParams) {
  const { formState, generationMode } = params;

  const generatedName = `${formState.baseName || ""}${
    formState.separator || ""
  }${
    generationMode === "BATCH"
      ? formState.suffix || ""
      : generateSeriesSuffix(params)
  }`;

  return generatedName;
}

function generateSeriesSuffix({ index, formState }: GenerateNameParams) {
  if (formState.increment === "NUMERICAL") {
    const start = formState.start ?? "001";
    const suffixLength = start.length;
    // correclty set the start when numerical input is null/empty, default to 1
    const suffixNumber = isNaN(parseInt(start, 10))
      ? index + 1
      : index + parseInt(start, 10);

    const computedSuffixLen =
      suffixLength && String(suffixNumber).length > suffixLength
        ? String(suffixNumber).length
        : suffixLength ?? String(suffixNumber).length;

    return padStart(String(suffixNumber), computedSuffixLen, "0");
  } else {
    const start = formState.start || "A";
    const sc = new SpreadSheetColumn();
    return sc.fromInt(index + sc.fromStr(start)) as string;
  }
}

const generatorFormSchema = yup.object({
  collection: yup.mixed().required(),
  numberToCreate: yup.number().required(),
  samples: yup.array(yup.object()).required(),
  baseName: yup.string(),
  separator: yup.string(),
  // Batch mode:
  suffix: yup.string(),
  // Series mode:
  increment: yup.string(),
  start: yup.string()
});

type GeneratorFormValues = yup.InferType<typeof generatorFormSchema>;
