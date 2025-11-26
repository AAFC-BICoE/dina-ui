import {
  BackToListButton,
  ButtonBar,
  CheckBoxField,
  DinaForm,
  DinaFormOnSubmit,
  LoadingSpinner,
  NumberSpinnerField,
  SelectField,
  SubmitButton,
  TextField,
  useApiClient
} from "common-ui";
import { Field, FormikContextType, useFormikContext } from "formik";
import { InputResource } from "kitsu";
import _ from "lodash";
import { useState } from "react";
import SpreadSheetColumn from "spreadsheet-column";
import * as yup from "yup";
import {
  CollectionSelectField,
  GroupSelectField,
  useLastUsedCollection
} from "..";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { MaterialSample } from "../../types/collection-api/resources/MaterialSample";
import { useGenerateSequence } from "../collection/material-sample/useGenerateSequence";
import { useEffect } from "react";
import { Collection } from "packages/dina-ui/types/collection-api";

export interface MaterialSampleGenerationFormProps {
  onGenerate: (samples: MaterialSampleGenerationFormSubmission) => void;
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
  initialValues,
  initialMode
}: MaterialSampleGenerationFormProps) {
  const [generationMode, setGenerationMode] = useState<GenerationMode>(
    initialMode || "SERIES"
  );
  const [useNextSequence, setUseNextSequence] = useState<boolean>(
    initialValues?.useNextSequence || false
  );

  const { save } = useApiClient();

  const { formatMessage } = useDinaIntl();

  const onSubmit: DinaFormOnSubmit<GeneratorFormValues> = ({
    submittedValues
  }) => {
    let generatedLowId: number;
    if (useNextSequence) {
      useGenerateSequence({
        collectionId: submittedValues.collection.id,
        amount: submittedValues.numberToCreate as any,
        save
      }).then(async (data) => {
        if (data.result?.lowReservedID && data.result.highReservedID) {
          generatedLowId = data.result?.lowReservedID;
          onGenerateSamples();
        }
      });
    } else {
      onGenerateSamples();
    }

    function onGenerateSamples() {
      const samples = [...Array(Number(submittedValues.numberToCreate))].map<
        InputResource<MaterialSample>
      >((_, index) => {
        const sample = submittedValues.samples[index];
        const materialSampleName = sample?.materialSampleName?.trim?.();
        const sourceSet =
          submittedValues.sourceSet !== undefined &&
          submittedValues.sourceSet !== ""
            ? submittedValues.sourceSet
            : undefined;
        return {
          type: "material-sample",
          parentMaterialSample: undefined,
          group: submittedValues.group,
          collection: submittedValues.collection,
          publiclyReleasable: true,
          sourceSet,
          ...sample,
          materialSampleName: materialSampleName
            ? materialSampleName
            : useNextSequence
            ? submittedValues.baseName
              ? submittedValues.baseName + (generatedLowId + index)
              : `${generatedLowId + index}`
            : generateName({
                generationMode,
                index,
                formState: submittedValues
              })
        };
      });
      onGenerate({ samples, submittedValues, generationMode });
    }
  };

  // Default to use the last used collection:
  const collectionQuery = useLastUsedCollection();

  if (collectionQuery.loading) {
    return <LoadingSpinner loading={true} />;
  }

  const baseNameFromCollection =
    collectionQuery?.lastUsedCollection?.code ??
    collectionQuery?.lastUsedCollection?.name;

  return (
    <DinaForm<Partial<GeneratorFormValues>>
      initialValues={
        initialValues || {
          numberToCreate: 1,
          samples: [],
          increment: "NUMERICAL",
          suffix: "",
          start: "001",
          baseName: "",
          separator: "",
          sourceSet: "",
          collection: collectionQuery.lastUsedCollection
        }
      }
      horizontal="flex"
      validationSchema={generatorFormSchema}
      onSubmit={onSubmit}
    >
      <div className="row">
        <GroupSelectField
          name="group"
          className="col-sm-6"
          enableStoredDefaultGroup={true}
        />
        <Field name="collection">
          {({ form }: any) => (
            <CollectionSelectField
              className="col-sm-6"
              name="collection"
              onChange={(value) => {
                form.setFieldValue("baseName", (value as Collection)?.code);
              }}
              cannotBeChanged={false}
            />
          )}
        </Field>
      </div>
      <div className="d-flex justify-content-between">
        <div style={{ width: "25rem" }}>
          <NumberSpinnerField
            name="numberToCreate"
            max={30}
            label={formatMessage("materialSamplesToCreate")}
          />
        </div>
        <CheckBoxField
          onCheckBoxClick={(event) => {
            setUseNextSequence(event.target.checked);
            setGenerationMode(GENERATION_MODES[0]);
          }}
          name="useNextSequence"
          className="gap-3 "
          overridecheckboxProps={{
            style: {
              height: "30px",
              width: "30px"
            }
          }}
        />
      </div>
      {!useNextSequence && (
        <GeneratorFields
          generationMode={generationMode}
          baseName={baseNameFromCollection}
        />
      )}

      {/* Source Set */}
      <div className="row">
        <TextField className="col-sm-6" name="sourceSet" />
      </div>

      {!useNextSequence && (
        <PreviewAndCustomizeFields generationMode={generationMode} />
      )}
      <ButtonBar centered={false}>
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

export const GENERATION_MODES = ["SERIES"] as const;
export type GenerationMode = (typeof GENERATION_MODES)[number];

export const INCREMENT_MODES = ["NUMERICAL", "LETTER"] as const;
export type IncrementMode = (typeof INCREMENT_MODES)[number];

interface GeneratorFieldsProps {
  generationMode: GenerationMode;
  useNextSequence?: boolean;
  baseName?: string;
}

function GeneratorFields({
  generationMode,
  useNextSequence,
  baseName
}: GeneratorFieldsProps) {
  const { formatMessage } = useDinaIntl();
  const formikForm = useFormikContext<any>();
  useEffect(() => {
    if (!formikForm.values.baseName) {
      formikForm.setFieldValue("baseName", baseName);
    }
  }, []);

  const SUFFIX_TYPE_OPTIONS = INCREMENT_MODES.map((mode) => ({
    label: formatMessage(mode),
    value: mode
  }));
  return (
    <div>
      <h4>
        <DinaMessage id="primaryId" />
      </h4>
      <div className="row">
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
                    onClick: (e) => (e.target as any).select()
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
        <TextField
          className="col-sm-6"
          name="baseName"
          inputProps={{
            disabled: useNextSequence
          }}
        />
        {generationMode === "SERIES" && (
          <TextField
            name="separator"
            className="col-md-3"
            inputProps={{
              disabled: useNextSequence
            }}
          />
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

            return _.range(0, formState.numberToCreate).map((index) => {
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
                      onChangeExternal={(form, name, value) => {
                        form.setFieldValue(name, value);
                      }}
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
  const { formState } = params;

  const generatedName = `${formState.baseName || ""}${
    formState.separator || ""
  }${generateSeriesSuffix(params)}`;
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

    return _.padStart(String(suffixNumber), computedSuffixLen, "0");
  } else {
    const start = formState.start || "A";
    try {
      const sc = new SpreadSheetColumn();
      return sc.fromInt(index + sc.fromStr(start)) as string;
    } catch {
      return "";
    }
  }
}

const generatorFormSchema = yup.object({
  group: yup.string().required(),
  collection: yup.mixed().required(),
  numberToCreate: yup.number().required(),
  samples: yup
    .array(
      yup.object({ materialSampleName: yup.string().nullable() }).nullable()
    )
    .required(),
  baseName: yup.string(),
  separator: yup.string(),
  sourceSet: yup.string(),
  // Batch mode:
  suffix: yup.string(),
  // Series mode:
  increment: yup.string(),
  start: yup.string(),
  useNextSequence: yup.boolean()
});

type GeneratorFormValues = yup.InferType<typeof generatorFormSchema>;
