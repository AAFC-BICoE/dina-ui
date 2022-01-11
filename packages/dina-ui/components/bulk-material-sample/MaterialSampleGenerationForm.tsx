import {
  BackToListButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  LoadingSpinner,
  NumberSpinnerField,
  SelectField,
  SubmitButton,
  TextField,
  useQuery,
  withResponse
} from "common-ui";
import { Field, FormikContextType } from "formik";
import { InputResource } from "kitsu";
import { padStart, range } from "lodash";
import Link from "next/link";
import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import SpreadSheetColumn from "spreadsheet-column";
import * as yup from "yup";
import { CollectionSelectField } from "..";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { MaterialSample } from "../../types/collection-api/resources/MaterialSample";
import { useLastUsedCollection } from "../collection";

export interface MaterialSampleGenerationFormProps {
  onGenerate: (samples: MaterialSampleGenerationFormSubmission) => void;
  parentId?: string;
  initialValues?: GeneratorFormValues;
  initialMode?: GenerationMode;
}

export interface MaterialSampleGenerationFormSubmission {
  samples: InputResource<MaterialSample>[];
  submittedValues: GeneratorFormValues;
  generationMode: GenerationMode;
}

export function MaterialSampleGenerationForm({
  onGenerate,
  parentId,
  initialValues,
  initialMode
}: MaterialSampleGenerationFormProps) {
  const [generationMode, setGenerationMode] = useState<GenerationMode>(
    initialMode || "BATCH"
  );
  const { formatMessage } = useDinaIntl();

  const onSubmit: DinaFormOnSubmit<GeneratorFormValues> = ({
    submittedValues
  }) => {
    const samples = [...Array(Number(submittedValues.numberToCreate))].map<
      InputResource<MaterialSample>
    >((_, index) => {
      const sample = submittedValues.samples[index];

      return {
        type: "material-sample",
        parentMaterialSample: parentId
          ? { id: parentId, type: "material-sample" }
          : undefined,
        collection: submittedValues.collection,
        publiclyReleasable: true,
        // Batch mode generates samples with the same name, so allow duplicate names in batch mode:
        allowDuplicateName: generationMode === "BATCH",
        ...sample,
        materialSampleName:
          sample?.materialSampleName?.trim?.() ||
          generateName({
            generationMode,
            index,
            formState: submittedValues
          })
      };
    });

    onGenerate({ samples, submittedValues, generationMode });
  };

  const parentQuery = useQuery<MaterialSample>(
    {
      path: `collection-api/material-sample/${parentId}`,
      include: "collection"
    },
    { disabled: !parentId }
  );

  // Default to use the last used collection:
  const collectionQuery = useLastUsedCollection();

  if (parentQuery.loading || collectionQuery.loading) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <DinaForm<GeneratorFormValues>
      initialValues={
        initialValues || {
          numberToCreate: 0,
          samples: [],
          increment: "NUMERICAL",
          suffix: "",
          start: "001",
          baseName: parentQuery.response?.data?.materialSampleName || "",
          separator: "",
          collection:
            parentQuery.response?.data?.collection ||
            collectionQuery.lastUsedCollection
        }
      }
      horizontal="flex"
      validationSchema={generatorFormSchema}
      onSubmit={onSubmit}
    >
      {parentId &&
        withResponse(parentQuery, ({ data: ms }) => (
          <h2>
            <DinaMessage id="splitFrom" />:{" "}
            <Link href={`/collection/material-sample/view?id=${ms.id}`}>
              <a target="_blank">{ms.materialSampleName}</a>
            </Link>
          </h2>
        ))}
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
        <BackToListButton
          className="ms-auto"
          entityLink="/collection/material-sample"
        >
          <DinaMessage id="cancelButtonText" />
        </BackToListButton>
        <SubmitButton
          buttonProps={(form: FormikContextType<GeneratorFormValues>) => ({
            disabled: !form.values.numberToCreate
          })}
        >
          <DinaMessage id="next" />
        </SubmitButton>
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
  const { formatMessage } = useDinaIntl();

  const SUFFIX_TYPE_OPTIONS = INCREMENT_MODES.map(mode => ({
    label: formatMessage(mode),
    value: mode
  }));

  return (
    <div>
      <h4>
        <DinaMessage id="primaryId" />
      </h4>
      <div className="row">
        <CollectionSelectField className="col-sm-6" name="collection" />
        {generationMode === "BATCH" && (
          <>
            <TextField name="suffix" className="col-md-3" />
            <TextField name="separator" className="col-md-3" />
          </>
        )}
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
        {generationMode === "SERIES" && (
          <TextField name="separator" className="col-md-3" />
        )}
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
                  <div className="sample-name" style={{ width: "20rem" }}>
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
    try {
      const sc = new SpreadSheetColumn();
      return sc.fromInt(index + sc.fromStr(start)) as string;
    } catch (error) {
      return "";
    }
  }
}

const generatorFormSchema = yup.object({
  collection: yup.mixed().required(),
  numberToCreate: yup.number().required(),
  samples: yup
    .array(
      yup.object({ materialSampleName: yup.string().nullable() }).nullable()
    )
    .required(),
  baseName: yup.string(),
  separator: yup.string(),
  // Batch mode:
  suffix: yup.string(),
  // Series mode:
  increment: yup.string(),
  start: yup.string()
});

type GeneratorFormValues = yup.InferType<typeof generatorFormSchema>;
