import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormSubmitParams,
  NumberField,
  SelectField,
  SubmitButton,
  TextField,
  ToggleField,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { GroupSelectField } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { StorageUnitType } from "../../../types/collection-api";
import { useFormikContext } from "formik";
import { DINAUI_MESSAGES_ENGLISH } from "../../../intl/dina-ui-en";
import PageLayout from "../../../components/page/PageLayout";

export default function StorageUnitTypeEditPage() {
  const router = useRouter();
  const { formatMessage } = useDinaIntl();

  const {
    query: { id }
  } = router;

  const storageUnitTypeQuery = useQuery<StorageUnitType>(
    { path: `collection-api/storage-unit-type/${id}` },
    { disabled: !id }
  );

  const title = id ? "editStorageUnitTypeTitle" : "addStorageUnitTypeTitle";

  async function goToViewPage(resource: PersistedResource<StorageUnitType>) {
    await router.push(`/collection/storage-unit-type/view?id=${resource.id}`);
  }

  return (
    <PageLayout titleId={formatMessage(title)}>
      {id ? (
        withResponse(storageUnitTypeQuery, ({ data }) => (
          <StorageUnitTypeForm storageUnitType={data} onSaved={goToViewPage} />
        ))
      ) : (
        <StorageUnitTypeForm onSaved={goToViewPage} />
      )}
    </PageLayout>
  );
}

export interface StorageUnitTypeFormProps {
  storageUnitType?: PersistedResource<StorageUnitType>;
  onSaved: (
    storageUnitType: PersistedResource<StorageUnitType>
  ) => Promise<void>;
}

export function StorageUnitTypeForm({
  storageUnitType,
  onSaved
}: StorageUnitTypeFormProps) {
  if (storageUnitType) {
    storageUnitType.enableGrid = storageUnitType.gridLayoutDefinition
      ? true
      : false;
  }
  const initialValues = storageUnitType || { type: "storage-unit-type" };
  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<StorageUnitType>) {
    if (
      submittedValues.enableGrid === false &&
      submittedValues.gridLayoutDefinition
    ) {
      delete submittedValues.gridLayoutDefinition;
    }
    delete submittedValues.enableGrid;

    const [savedStorageType] = await save<StorageUnitType>(
      [
        {
          resource: submittedValues,
          type: "storage-unit-type"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    await onSaved(savedStorageType);
  }

  const buttonBar = (
    <ButtonBar className="mb-3">
      <div className="col-md-6 col-sm-12 mt-2">
        <BackButton
          entityId={storageUnitType?.id}
          entityLink="/collection/storage-unit-type"
        />
      </div>
      <div className="col-md-6 col-sm-12 d-flex">
        <SubmitButton className="ms-auto" />
      </div>
    </ButtonBar>
  );

  return (
    <DinaForm<Partial<StorageUnitType>>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {buttonBar}
      <StorageUnitTypeFormFields />
    </DinaForm>
  );
}

export type FillDirectionType = "BY_ROW" | "BY_COLUMN";

export const FILL_DIRECTION_OPTIONS: {
  labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH;
  value: FillDirectionType;
}[] = [
  {
    labelKey: "field_gridLayoutDefinition_row_label",
    value: "BY_ROW"
  },
  {
    labelKey: "field_gridLayoutDefinition_column_label",
    value: "BY_COLUMN"
  }
];

/** Re-usable field layout between edit and view pages. */
export function StorageUnitTypeFormFields() {
  const { formatMessage } = useDinaIntl();
  const { readOnly } = useDinaFormContext();
  const formik = useFormikContext<any>();
  const FILL_DIRECTION_OPTIONS_LABELS = FILL_DIRECTION_OPTIONS.map(
    ({ labelKey, value }) => ({ label: formatMessage(labelKey), value })
  );

  if (readOnly) {
    formik.values.enableGrid = formik.values.gridLayoutDefinition
      ? true
      : false;
  }

  return (
    <div>
      <div className="row">
        <TextField className="col-md-6" name="name" />
        {!readOnly && (
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-6"
          />
        )}
        <ToggleField className="col-md-3" name="enableGrid" />
      </div>
      {formik.values.enableGrid && (
        <div>
          <div className="row">
            <NumberField
              name="gridLayoutDefinition.numberOfRows"
              customName="rows"
              className="col-md-6"
              inputProps={{ type: "number" }}
              min={1}
            />
            <NumberField
              name="gridLayoutDefinition.numberOfColumns"
              customName="columns"
              className="col-md-6"
              inputProps={{ type: "number" }}
              min={1}
            />
          </div>
          <div className="row">
            <SelectField
              name="gridLayoutDefinition.fillDirection"
              customName="fillDirection"
              className="col-md-6"
              options={FILL_DIRECTION_OPTIONS_LABELS}
              readOnlyRender={(selectedvalue) => {
                const option = FILL_DIRECTION_OPTIONS_LABELS.find(
                  (optionLabel) =>
                    optionLabel.value.toString() === selectedvalue
                );
                return option?.label;
              }}
            />
          </div>
        </div>
      )}

      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" name="createdOn" />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </div>
  );
}
