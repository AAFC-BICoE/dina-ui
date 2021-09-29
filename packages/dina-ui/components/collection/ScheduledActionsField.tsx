import {
  DateField,
  DinaForm,
  FieldSet,
  FormikButton,
  TextField
} from "common-ui";
import { FastField } from "formik";
import { useState } from "react";
import ReactTable, { Column } from "react-table";
import { UserSelectField } from "..";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { ScheduledAction } from "../../types/collection-api";
import { isPlainObject } from "lodash";

export interface ScheduledActionsFieldProps {
  className?: string;
}

export function ScheduledActionsField({
  className
}: ScheduledActionsFieldProps) {
  const fieldName = "scheduledActions";

  const [actionToEdit, setActionToEdit] = useState<
    "NEW" | { index: number; viewIndex: number } | null
  >("NEW");

  function expandRow(row) {
    setActionToEdit({ index: row.index, viewIndex: row.viewIndex });
  }

  const actionColumns: Column[] = [
    { accessor: "actionType", Header: "Action Type" },
    { accessor: "date", Header: "Date" },
    { accessor: "status", Header: "Status" },
    { accessor: "assignedTo", Header: "Assigned to" },
    { accessor: "remarks", Header: "Remarks" },
    {
      Cell: row => (
        <FormikButton
          className="btn btn-primary mb-3"
          buttonProps={() => ({ style: { width: "10rem" } })}
          onClick={() => expandRow(row)}
        >
          <DinaMessage id="editButtonText" />
        </FormikButton>
      )
    }
  ];

  return (
    <FastField name={fieldName} key={JSON.stringify(actionToEdit)}>
      {({ field: { value }, form }) => {
        const scheduledActions = (value ?? []) as ScheduledAction[];

        const hasActions = !!scheduledActions.length;

        const isEditingExisting = isPlainObject(actionToEdit);

        async function saveAction(savedAction: ScheduledAction) {
          if (actionToEdit === "NEW") {
            form.setFieldValue(fieldName, [...scheduledActions, savedAction]);
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
          <FieldSet
            className={className}
            id="scheduled-actions-section"
            legend={<DinaMessage id="scheduledActions" />}
          >
            {hasActions && (
              <ReactTable
                columns={actionColumns}
                defaultSorted={[{ id: "date", desc: true }]}
                data={scheduledActions}
                minRows={scheduledActions.length}
                showPagination={false}
                className="-striped mb-2"
                // Implement the edit feature:
                ExpanderComponent={() => null}
                expanded={
                  typeof actionToEdit === "object"
                    ? { [actionToEdit?.viewIndex ?? -1]: true }
                    : undefined
                }
                SubComponent={row => (
                  <div className="m-2">
                    <ScheduledActionSubForm
                      actionToEdit={row.original}
                      onSaveAction={saveAction}
                      onCancelClick={
                        hasActions ? () => setActionToEdit(null) : undefined
                      }
                    />
                  </div>
                )}
                sortable={false}
              />
            )}
            {!hasActions || actionToEdit === "NEW" ? (
              <ScheduledActionSubForm
                onSaveAction={saveAction}
                onCancelClick={
                  hasActions ? () => setActionToEdit(null) : undefined
                }
              />
            ) : (
              <FormikButton
                className="btn btn-primary mb-3 add-new-button"
                buttonProps={() => ({ style: { width: "10rem" } })}
                onClick={() => setActionToEdit("NEW")}
              >
                <DinaMessage id="addNew" />
              </FormikButton>
            )}
          </FieldSet>
        );
      }}
    </FastField>
  );
}

export interface ScheduledActionSubFormProps {
  onSaveAction: (action: ScheduledAction) => Promise<void>;
  onCancelClick?: () => void;
  actionToEdit?: ScheduledAction;
}

export function ScheduledActionSubForm({
  onSaveAction,
  onCancelClick,
  actionToEdit
}: ScheduledActionSubFormProps) {
  function disableEnterToSubmitOuterForm(e) {
    // Pressing enter should not submit the outer form:
    if (e.keyCode === 13 && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      // TODO Submit inner form.
    }
  }

  return (
    <div onKeyDown={disableEnterToSubmitOuterForm}>
      <FieldSet legend={<DinaMessage id="addScheduledAction" />}>
        <DinaForm initialValues={actionToEdit ?? {}}>
          <div className="row">
            <TextField name="actionType" className="col-sm-6" />
            <DateField name="date" className="col-sm-6" />
          </div>
          <div className="row">
            <TextField name="actionStatus" className="col-sm-6" />
            <UserSelectField name="assignedTo" className="col-sm-6" />
          </div>
          <TextField name="remarks" multiLines={true} />
          <div className="d-flex justify-content-center gap-2">
            <FormikButton
              className="btn btn-primary mb-3 add-button"
              buttonProps={() => ({ style: { width: "10rem" } })}
              onClick={onSaveAction}
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
        </DinaForm>
      </FieldSet>
    </div>
  );
}
