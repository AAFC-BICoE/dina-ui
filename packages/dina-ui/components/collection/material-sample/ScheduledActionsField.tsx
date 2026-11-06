import classNames from "classnames";
import {
  CreatableSelectField,
  DateField,
  DinaForm,
  DinaFormSection,
  FieldSet,
  FieldSpy,
  FormikButton,
  OnFormikSubmit,
  TextField,
  useDinaFormContext
} from "common-ui";
import _ from "lodash";
import moment, { Moment } from "moment";
import { Fragment, ReactNode, useRef, useState } from "react";
import { FaPlus, FaRegCalendar } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import * as yup from "yup";
import { UserSelectField } from "../..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  SCHEDULED_ACTIONS_COMPONENT_NAME,
  ScheduledAction
} from "../../../types/collection-api";
import styles from "./ScheduledActionsField.module.css";

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

/** Pill color per lower-cased status. Any other status is gray. */
const PILL_COLORS: Record<string, string> = {
  pending: styles.amber,
  "in progress": styles.blue,
  done: styles.green
};

/** Determine the date box color based on the status and if it's past due */
function dateBoxColor(status: string, date: Moment) {
  // Cancelled actions are always gray.
  if (status.startsWith("cancel")) return styles.cancelled;

  // Future or current actions are navy.
  if (!date.isBefore(moment(), "day")) return styles.navy;

  // Overdue actions are red unless done, which is green.
  return status === "done" ? styles.green : styles.red;
}

export function ScheduledActionsField({
  className,
  defaultDate = moment().format("YYYY-MM-DD"),
  wrapContent = (content) => content,
  id = SCHEDULED_ACTIONS_COMPONENT_NAME
}: ScheduledActionsFieldProps) {
  const fieldName = "scheduledActions";

  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  /** Index (in the form's array) of the action being edited. */
  const [editIndex, setEditIndex] = useState<number | null>(null);

  /** Whether the empty-state placeholder was swapped for the form. */
  const [formOpen, setFormOpen] = useState(false);

  const addButtonRef = useRef<HTMLButtonElement>(null);

  function closeEmptyForm() {
    setFormOpen(false);
    setTimeout(() => addButtonRef.current?.focus());
  }

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
            const actions = (value ?? []) as ScheduledAction[];
            // Sort by date to make it easier to see upcoming actions first.
            const rows = _.sortBy(
              actions.map((action, index) => ({ action, index })),
              "action.date"
            );

            // Remove an action from the form's array by its index.
            function removeAction(index: number) {
              form.setFieldValue(
                fieldName,
                actions.filter((_it, i) => i !== index)
              );
              if (editIndex === index) {
                setEditIndex(null);
              } else if (editIndex !== null && index < editIndex) {
                // Keep editing the same action after the one above it is removed:
                setEditIndex(editIndex - 1);
              }
            }

            // Save a new or edited action to the form's array.
            async function saveAction(saved: ScheduledAction) {
              form.setFieldValue(
                fieldName,
                editIndex === null
                  ? [...actions, saved]
                  : actions.map((it, i) => (i === editIndex ? saved : it))
              );
              setEditIndex(null);
              setFormOpen(false);
            }

            return (
              <div className="pb-3">
                {/* No scheduled actions found, show placeholder and add button if not read-only */}
                {!rows.length && !formOpen && (
                  <section
                    aria-label={formatMessage("scheduledActions")}
                    className={styles.placeholder}
                  >
                    <FaRegCalendar size={28} color="#adb5bd" aria-hidden />
                    <div className="small text-muted my-2">
                      <DinaMessage id="noRowsFound" />
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        ref={addButtonRef}
                        className="btn btn-outline-primary"
                        aria-expanded={false}
                        onClick={() => setFormOpen(true)}
                      >
                        <FaPlus className="me-2" aria-hidden />
                        <DinaMessage id="addScheduledAction" />
                      </button>
                    )}
                  </section>
                )}

                {/* Display the list of scheduled actions if any exist */}
                {!!rows.length && (
                  <ul className={styles.list}>
                    {rows.map(({ action, index }) => {
                      // The form requires a date, so it is always set:
                      const date = moment(action.date);
                      const status = action.actionStatus?.toLowerCase() ?? "";
                      return (
                        <li
                          key={index}
                          className={classNames(
                            styles.action,
                            editIndex === index && styles.editing
                          )}
                        >
                          <div
                            className={classNames(
                              styles.tile,
                              dateBoxColor(status, date)
                            )}
                          >
                            <div className={styles.month}>
                              {date.format("MMM")}
                            </div>
                            <div className={styles.day}>
                              {date.format("DD")}
                            </div>
                            <div>{date.format("YYYY")}</div>
                          </div>
                          <div className={styles.details}>
                            <strong className={styles.type}>
                              {action.actionType}
                            </strong>
                            {action.actionStatus && (
                              <span
                                className={classNames(
                                  styles.pill,
                                  PILL_COLORS[status] ?? styles.gray
                                )}
                              >
                                {action.actionStatus}
                              </span>
                            )}
                            <span className="small text-muted ms-2">
                              {date.isSame(moment(), "day")
                                ? formatMessage("today")
                                : date.from(moment().startOf("day"))}
                            </span>
                            <div
                              className={classNames(
                                "text-muted",
                                styles.subline
                              )}
                            >
                              <DinaFormSection readOnly={true}>
                                <UserSelectField
                                  name={`${fieldName}[${index}].assignedTo`}
                                  removeLabel={true}
                                  additionalSort="username"
                                />
                              </DinaFormSection>
                              {action.remarks && (
                                <span className="text-truncate">
                                  {action.assignedTo && "· "}
                                  {action.remarks}
                                </span>
                              )}
                            </div>
                          </div>
                          {!readOnly && (
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className={classNames(
                                  styles.rowButton,
                                  styles.edit
                                )}
                                title={formatMessage("editButtonText")}
                                aria-label={formatMessage("editButtonText")}
                                onClick={() => setEditIndex(index)}
                              >
                                <MdEdit />
                              </button>
                              <button
                                type="button"
                                className={classNames(
                                  styles.rowButton,
                                  styles.remove
                                )}
                                title={formatMessage("remove")}
                                aria-label={formatMessage("remove")}
                                onClick={() => removeAction(index)}
                              >
                                <MdDelete />
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Add/Edit form */}
                {!readOnly && (!!rows.length || formOpen) && (
                  <div className={styles.form}>
                    <ScheduledActionSubForm
                      // Remount to load the edited action, or to clear the form after a save:
                      key={editIndex ?? `new-${actions.length}`}
                      actionToEdit={
                        editIndex === null ? undefined : actions[editIndex]
                      }
                      defaultDate={defaultDate}
                      existingActions={actions}
                      onSaveAction={saveAction}
                      autoFocus={formOpen}
                      onCancelClick={
                        formOpen
                          ? closeEmptyForm
                          : editIndex === null
                          ? undefined
                          : () => setEditIndex(null)
                      }
                    />
                  </div>
                )}
              </div>
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
  /** Previously entered values, offered as options. */
  existingActions?: ScheduledAction[];
  autoFocus?: boolean;
}

export function ScheduledActionSubForm({
  onSaveAction,
  onCancelClick,
  actionToEdit,
  defaultDate,
  existingActions = [],
  autoFocus
}: ScheduledActionSubFormProps) {
  const { initialValues, isTemplate, formTemplate } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

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
    if (!_.isEmpty(formErrors)) {
      formik.setErrors({ ...formik.errors, ...formErrors });
      return;
    }
    await onSaveAction(newAction);
  };

  const defaultInitialValues = {
    date: defaultDate
  };

  const toOptions = (values: (string | undefined)[]) =>
    _.uniq(_.compact(values)).map((it) => ({ label: it, value: it }));

  return (
    <div onKeyDown={disableEnterToSubmitOuterForm}>
      <div className="fw-bold mb-2">
        <DinaMessage
          id={actionToEdit ? "editScheduledAction" : "addScheduledAction"}
        />
      </div>
      <FormWrapper
        validationSchema={scheduledActionSchema}
        {...(!isTemplate ? { formTemplate } : {})}
        initialValues={
          actionToEdit ?? actionTemplateInitialValues ?? defaultInitialValues
        }
        componentName={SCHEDULED_ACTIONS_COMPONENT_NAME}
        sectionName="scheduled-actions-add-section"
      >
        {/* Labels are hidden, so each select gets an aria-label as its accessible name. */}
        <div className={styles.fields}>
          <CreatableSelectField<string>
            {...fieldProps("actionType")}
            removeLabel={true}
            options={toOptions(existingActions.map((it) => it.actionType))}
            selectProps={{
              placeholder: formatMessage("actionType"),
              "aria-label": formatMessage("actionType"),
              autoFocus
            }}
          />
          <DateField {...fieldProps("date")} removeLabel={true} />
          <CreatableSelectField<string>
            {...fieldProps("actionStatus")}
            removeLabel={true}
            options={toOptions([
              "Pending",
              "In progress",
              "Done",
              ...existingActions.map((it) => it.actionStatus)
            ])}
            selectProps={{
              placeholder: formatMessage("actionStatus"),
              "aria-label": formatMessage("actionStatus")
            }}
          />
          <UserSelectField
            {...fieldProps("assignedTo")}
            removeLabel={true}
            additionalSort="username"
            placeholder={formatMessage("assignedTo")}
            selectProps={{ "aria-label": formatMessage("assignedTo") }}
          />
        </div>
        <TextField
          {...fieldProps("remarks")}
          removeLabel={true}
          placeholder={formatMessage("remarks")}
        />
        {!isTemplate && (
          <div className="d-flex justify-content-end gap-2">
            {onCancelClick && (
              <FormikButton className="btn btn-dark" onClick={onCancelClick}>
                <DinaMessage id="cancelButtonText" />
              </FormikButton>
            )}
            <FormikButton
              className={classNames("btn btn-primary", styles.submit)}
              buttonProps={({ values }) => ({
                disabled: !(
                  values.actionType &&
                  values.date &&
                  values.actionStatus
                )
              })}
              onClick={submitAction}
            >
              <DinaMessage id={actionToEdit ? "submitBtnText" : "add"} />
            </FormikButton>
          </div>
        )}
      </FormWrapper>
    </div>
  );
}
