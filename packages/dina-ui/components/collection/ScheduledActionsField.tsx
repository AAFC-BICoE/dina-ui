import {
  DateField,
  DinaForm,
  FieldSet,
  FormikButton,
  TextField,
  useDinaFormContext
} from "common-ui";
import { FastField } from "formik";
import { useState } from "react";
import ReactTable from "react-table";
import { UserSelectField } from "..";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { ScheduledAction } from "../../types/collection-api";

export interface ScheduledActionsFieldProps {
  className?: string;
}

export function ScheduledActionsField({
  className
}: ScheduledActionsFieldProps) {
  const { initialValues } = useDinaFormContext();

  const fieldName = "scheduledActions";

  const initialActions = (initialValues.scheduledActions ??
    []) as ScheduledAction[];

  const actionColumns = [
    { accessor: "actionType", Header: "Action Type" },
    { accessor: "date", Header: "Date" },
    { accessor: "status", Header: "Status" },
    { accessor: "assignedTo", Header: "Assigned to" },
    { accessor: "remarks", Header: "Remarks" }
  ];

  const [actionFormIsOpen, setActionFormIsOpen] = useState(
    !initialActions.length
  );

  return (
    <FastField name={fieldName} key={String(actionFormIsOpen)}>
      {({ field: { value }, form }) => {
        const scheduledActions = (value ?? []) as ScheduledAction[];

        const hasActions = !!scheduledActions.length;

        async function saveAction(savedAction: ScheduledAction) {
          const isNew = savedAction && !scheduledActions.includes(savedAction);

          if (isNew) {
            form.setFieldValue(fieldName, [...scheduledActions, savedAction]);
          } else {
            form.setFieldValue(
              fieldName,
              scheduledActions.map(action =>
                action === savedAction ? savedAction : action
              )
            );
          }
          setActionFormIsOpen(false);
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
              />
            )}
            {actionFormIsOpen ? (
              <ScheduledActionSubForm
                onSaveAction={saveAction}
                onCancelClick={() => setActionFormIsOpen(false)}
              />
            ) : (
              <FormikButton
                className="btn btn-primary mb-3"
                buttonProps={() => ({ style: { width: "10rem" } })}
                onClick={() => setActionFormIsOpen(true)}
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
}

export function ScheduledActionSubForm({
  onSaveAction,
  onCancelClick
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
        <DinaForm initialValues={{}}>
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
              className="btn btn-primary mb-3"
              buttonProps={() => ({ style: { width: "10rem" } })}
              onClick={onSaveAction}
            >
              <DinaMessage id="add" />
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
