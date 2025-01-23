import { ColumnDef, Row } from "@tanstack/react-table";
import {
  AutoSuggestTextField,
  DateField,
  DinaForm,
  DinaFormSection,
  FieldHeader,
  FieldSet,
  FieldSpy,
  FormikButton,
  JsonApiQuerySpec,
  OnFormikSubmit,
  ReactTable,
  TextField,
  useDinaFormContext
} from "common-ui";
import { FormikContextType } from "formik";
import { isEmpty } from "lodash";
import { Fragment, ReactNode, useState } from "react";
import * as yup from "yup";
import { UserSelectField } from "../..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  MaterialSample,
  SCHEDULED_ACTIONS_COMPONENT_NAME,
  ScheduledAction
} from "../../../types/collection-api";

/** Type-safe object with all ScheduledAction fields. */
export const SCHEDULEDACTION_FIELDS_OBJECT: Required<
  Record<keyof ScheduledAction, true>
> = {
  actionStatus: true,
  actionType: true,
  assignedTo: true,
  date: true,
  remarks: true
};

/** All fields of the ScheduledAction type. */
export const SCHEDULEDACTION_FIELDS = Object.keys(
  SCHEDULEDACTION_FIELDS_OBJECT
);

export const scheduledActionSchema = yup.object({
  actionType: yup.string().required()
});

export interface ScheduledActionsFieldProps {
  className?: string;
  defaultDate?: string;
  wrapContent?: (content: ReactNode) => ReactNode;
  id?: string;
}

export function ScheduledActionsField({
  className,
  // The default date is today:
  defaultDate = new Date().toISOString().slice(0, 10),
  wrapContent = (content) => content,
  id = SCHEDULED_ACTIONS_COMPONENT_NAME
}: ScheduledActionsFieldProps) {
  const fieldName = "scheduledActions";

  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  const [actionToEdit, setActionToEdit] = useState<
    "NEW" | { index: number } | null
  >(null);

  const isEditing = !!actionToEdit;

  function openRowEditor(row: Row<ScheduledAction>) {
    row.getToggleExpandedHandler()();
    setActionToEdit({ index: row.index });
  }

  function removeAction(
    formik: FormikContextType<ScheduledAction>,
    index: number
  ) {
    setActionToEdit(null);
    const scheduledActions =
      formik.getFieldMeta<ScheduledAction[]>(fieldName).value ?? [];
    // Remove the item at the index:
    formik.setFieldValue(fieldName, [
      ...scheduledActions.slice(0, index),
      ...scheduledActions.slice(index + 1)
    ]);
  }

  const buttonProps = () => ({ disabled: isEditing, style: { width: "7rem" } });

  const actionColumns: ColumnDef<ScheduledAction>[] = [
    {
      id: "actionType",
      accessorKey: "actionType",
      header: () => <FieldHeader name={formatMessage("actionType")} />
    },
    {
      id: "date",
      accessorKey: "date",
      header: () => <FieldHeader name={formatMessage("date")} />
    },
    {
      id: "actionStatus",
      accessorKey: "actionStatus",
      header: () => <FieldHeader name={formatMessage("status")} />
    },
    {
      id: "assignedTo",
      accessorKey: "assignedTo",
      header: () => <FieldHeader name={formatMessage("assignedTo")} />,
      cell: ({ row }) => (
        <DinaFormSection readOnly={true}>
          <UserSelectField
            name={`${fieldName}[${row.index}].assignedTo`}
            removeLabel={true}
          />
        </DinaFormSection>
      )
    },
    {
      id: "remarks",
      accessorKey: "remarks",
      header: () => <FieldHeader name={formatMessage("remarks")} />
    },
    ...(readOnly
      ? []
      : [
          {
            id: "action",
            size: 270,
            cell: ({ row }) => (
              <div className={`d-flex gap-3`}>
                <FormikButton
                  className="btn btn-primary edit-button"
                  buttonProps={buttonProps}
                  onClick={() => openRowEditor(row)}
                >
                  <DinaMessage id="editButtonText" />
                </FormikButton>
                <FormikButton
                  className="btn btn-danger remove-button"
                  buttonProps={buttonProps}
                  onClick={(_, form) => removeAction(form, row.index)}
                >
                  <DinaMessage id="remove" />
                </FormikButton>
              </div>
            )
          }
        ])
  ];

  return (
    <FieldSet
      className={className}
      id={id}
      legend={<DinaMessage id="scheduledActions" />}
      fieldName={fieldName}
      componentName={SCHEDULED_ACTIONS_COMPONENT_NAME}
      sectionName="scheduled-actions-add-section"
    >
      {wrapContent(
        <FieldSpy fieldName={fieldName}>
          {(value, { form }) => {
            const scheduledActions = (value ?? []) as ScheduledAction[];

            const hasActions = !!scheduledActions.length;

            async function saveAction(savedAction: ScheduledAction) {
              if (actionToEdit === "NEW" || !actionToEdit) {
                form.setFieldValue(fieldName, [
                  ...scheduledActions,
                  savedAction
                ]);
              } else {
                form.setFieldValue(
                  fieldName,
                  scheduledActions.map((action, index) =>
                    index === actionToEdit?.index ? savedAction : action
                  )
                );
              }
              setActionToEdit(null);
            }

            return (
              <>
                {hasActions && (
                  <ReactTable<ScheduledAction>
                    columns={actionColumns}
                    sort={[{ id: "date", desc: true }]}
                    data={scheduledActions}
                    showPagination={false}
                    className="-striped mb-2"
                    getRowCanExpand={() => true}
                    renderSubComponent={({ row }) => (
                      <div className="m-2">
                        <ScheduledActionSubForm
                          actionToEdit={row.original}
                          defaultDate={defaultDate}
                          onSaveAction={(newAction) => {
                            row.getToggleExpandedHandler()();
                            return saveAction(newAction);
                          }}
                          onCancelClick={
                            hasActions
                              ? () => {
                                  setActionToEdit(null);
                                  row.getToggleExpandedHandler()();
                                }
                              : undefined
                          }
                        />
                      </div>
                    )}
                  />
                )}
                {readOnly ? null : !hasActions || actionToEdit === "NEW" ? (
                  <ScheduledActionSubForm
                    defaultDate={defaultDate}
                    onSaveAction={(newAction) => {
                      return saveAction(newAction);
                    }}
                    onCancelClick={
                      hasActions ? () => setActionToEdit(null) : undefined
                    }
                  />
                ) : (
                  <FormikButton
                    className="btn btn-primary mb-3 add-new-button"
                    buttonProps={buttonProps}
                    onClick={() => setActionToEdit("NEW")}
                  >
                    <DinaMessage id="addNew" />
                  </FormikButton>
                )}
              </>
            );
          }}
        </FieldSpy>
      )}
    </FieldSet>
  );
}

export interface ScheduledActionSubFormProps {
  onSaveAction: (action: ScheduledAction) => Promise<void>;
  onCancelClick?: () => void;
  actionToEdit?: ScheduledAction;
  defaultDate: string;
}

export function ScheduledActionSubForm({
  onSaveAction,
  onCancelClick,
  actionToEdit,
  defaultDate
}: ScheduledActionSubFormProps) {
  const { initialValues, isTemplate } = useDinaFormContext();

  // TODO: This needs to be fixed.
  const enabledFields: string[] = [];

  const actionTemplateInitialValues = enabledFields
    ? initialValues.scheduledAction
    : undefined;

  function disableEnterToSubmitOuterForm(e) {
    // Pressing enter should not submit the outer form:
    if (e.keyCode === 13 && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      // TODO Submit inner form.
    }
  }

  // Use a subform for Material Sample form, or use the parent template form for templates.
  const FormWrapper = isTemplate ? Fragment : DinaForm;

  /** Applies name prefix to field props */
  function fieldProps(fieldName: keyof ScheduledAction) {
    const templateFieldName = `scheduledAction.${fieldName}`;
    return {
      name: isTemplate ? templateFieldName : fieldName,
      // If the first determination is enabled, then enable multiple determinations:
      templateCheckboxFieldName: templateFieldName,
      // Don't use the prefix for the labels and tooltips:
      customName: fieldName
    };
  }

  const submitAction: OnFormikSubmit<any> = async (newAction, formik) => {
    // Return if the sub-form has errors:
    const formErrors = await formik.validateForm();
    if (!isEmpty(formErrors)) {
      formik.setErrors({ ...formik.errors, ...formErrors });
      return;
    }
    await onSaveAction(newAction);
  };

  // Fetch the last 50 scheduled actions.
  // No filtering by search text yet due to API limitations. The future search API should provide better autocomplete support.
  const autoSuggestQuery: (
    searchTerm: string,
    formikCtx: FormikContextType<any>
  ) => JsonApiQuerySpec = (_, ctx) => ({
    path: "collection-api/material-sample",
    fields: { "material-sample": "scheduledActions" },
    filter: {
      scheduledActions: { NEQ: "null" },
      ...(ctx.values.group && { group: { EQ: ctx.values.group } })
    },
    page: { limit: 50 }
  });

  const defaultInitialValues = {
    date: defaultDate
  };

  return (
    <div onKeyDown={disableEnterToSubmitOuterForm}>
      <FieldSet legend={<DinaMessage id="addScheduledAction" />}>
        <FormWrapper
          validationSchema={scheduledActionSchema}
          initialValues={
            actionToEdit ?? actionTemplateInitialValues ?? defaultInitialValues
          }
          componentName={SCHEDULED_ACTIONS_COMPONENT_NAME}
          sectionName="scheduled-actions-add-section"
        >
          <div className="row">
            <AutoSuggestTextField<MaterialSample>
              {...fieldProps("actionType")}
              jsonApiBackend={{
                query: autoSuggestQuery,
                option: (matSample) =>
                  matSample?.scheduledActions?.map(
                    (it) => it?.actionType ?? ""
                  ) ?? ""
              }}
              blankSearchBackend={"json-api"}
              className="col-sm-6"
            />
            <DateField {...fieldProps("date")} className="col-sm-6" />
          </div>
          <div className="row">
            <AutoSuggestTextField<MaterialSample>
              {...fieldProps("actionStatus")}
              jsonApiBackend={{
                query: autoSuggestQuery,
                option: (matSample) =>
                  matSample?.scheduledActions?.map(
                    (it) => it?.actionStatus ?? ""
                  ) ?? ""
              }}
              blankSearchBackend={"json-api"}
              className="col-sm-6"
            />
            <UserSelectField
              {...fieldProps("assignedTo")}
              className="col-sm-6"
            />
          </div>
          <TextField {...fieldProps("remarks")} multiLines={true} />
          {!isTemplate && (
            <div className="d-flex justify-content-center gap-2">
              <FormikButton
                className="btn btn-primary mb-3 add-button"
                buttonProps={() => ({ style: { width: "10rem" } })}
                onClick={submitAction}
              >
                <DinaMessage id={actionToEdit ? "submitBtnText" : "add"} />
              </FormikButton>
              {onCancelClick && (
                <FormikButton
                  className="btn btn-dark mb-3"
                  buttonProps={() => ({ style: { width: "10rem" } })}
                  onClick={onCancelClick}
                >
                  <DinaMessage id="cancelButtonText" />
                </FormikButton>
              )}
            </div>
          )}
        </FormWrapper>
      </FieldSet>
    </div>
  );
}
