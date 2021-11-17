import {
  AssociatedMaterialSampleSearchBox,
  AutoSuggestTextField,
  DinaForm,
  FieldSet,
  FormikButton,
  OnFormikSubmit,
  TextField,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { FastField, FormikContextType } from "formik";
import { isEmpty } from "lodash";
import Link from "next/link";
import React, { Fragment, MutableRefObject, useState } from "react";
import ReactTable, { CellInfo, Column } from "react-table";
import * as yup from "yup";
import { VocabularyReadOnlyView, VocabularySelectField } from "..";
import {
  MaterialSample,
  MaterialSampleAssociation
} from "../../../dina-ui/types/collection-api/resources/MaterialSample";
import { Vocabulary } from "../../../dina-ui/types/collection-api/resources/VocabularyElement";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

/** Type-safe object with all MaterialSampleAssociation fields. */
export const MATERIALSAMPLE_ASSOCIATION_FIELDS_OBJECT: Required<
  Record<keyof MaterialSampleAssociation, true>
> = {
  associatedSample: true,
  associationType: true,
  remarks: true
};

/** All fields of the MaterialSampleAssociation type. */
export const MATERIALSAMPLE_ASSOCIATION_FIELDS = Object.keys(
  MATERIALSAMPLE_ASSOCIATION_FIELDS_OBJECT
);

export const associationSchema = yup.object({
  associatedSample: yup.string().required(),
  associationType: yup.string().required()
});

export interface MaterialSampleAssociationsFieldProps {
  className?: string;
}

export function MaterialSampleAssociationsField({
  className
}: MaterialSampleAssociationsFieldProps) {
  const fieldName = "associations";

  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  const [associationToEdit, setAssociationToEdit] = useState<
    "NEW" | { index: number; viewIndex: number } | null
  >(null);

  const isEditing = !!associationToEdit;

  function openRowEditor(row: CellInfo) {
    setAssociationToEdit({ index: row.index, viewIndex: row.viewIndex });
  }

  function removeAssociation(
    formik: FormikContextType<MaterialSampleAssociation>,
    index: number
  ) {
    setAssociationToEdit(null);
    const associations =
      formik.getFieldMeta<MaterialSampleAssociation[]>(fieldName).value ?? [];
    // Remove the item at the index:
    formik.setFieldValue(fieldName, [
      ...associations.slice(0, index),
      ...associations.slice(index + 1)
    ]);
  }

  const buttonProps = () => ({ disabled: isEditing, style: { width: "7rem" } });

  const associationColumns: Column[] = [
    {
      accessor: "associationType",
      Header: formatMessage("associationType"),
      Cell: ({ original }) => (
        <VocabularyReadOnlyView
          value={original.associationType}
          path="collection-api/vocabulary/associationType"
        />
      )
    },
    {
      accessor: "associatedSample",
      Header: formatMessage("associatedMaterialSample"),
      Cell: ({ original }) =>
        original.associatedSample ? (
          <MaterialSampleLink id={original.associatedSample} />
        ) : null
    },
    { accessor: "remarks", Header: formatMessage("remarks") },
    ...(readOnly
      ? []
      : [
          {
            Cell: row => (
              <div className={`d-flex gap-3 index-${row.index}`}>
                <FormikButton
                  className="btn btn-primary mb-3 edit-button"
                  buttonProps={buttonProps}
                  onClick={() => openRowEditor(row)}
                >
                  <DinaMessage id="editButtonText" />
                </FormikButton>
                <FormikButton
                  className="btn btn-danger mb-3 remove-button"
                  buttonProps={buttonProps}
                  onClick={(_, form) => removeAssociation(form, row.index)}
                >
                  <DinaMessage id="remove" />
                </FormikButton>
              </div>
            )
          }
        ])
  ];

  return (
    <FastField name={fieldName} key={JSON.stringify(associationToEdit)}>
      {({ field: { value }, form }) => {
        const associations = (value ?? []) as MaterialSampleAssociation[];

        const hasAssociations = !!associations.length;

        async function saveAssociation(
          svedAssociation: MaterialSampleAssociation
        ) {
          if (associationToEdit === "NEW" || !associationToEdit) {
            form.setFieldValue(fieldName, [...associations, svedAssociation]);
          } else {
            form.setFieldValue(
              fieldName,
              associations.map((association, index) =>
                index === associationToEdit?.index
                  ? svedAssociation
                  : association
              )
            );
          }
          setAssociationToEdit(null);
        }

        return (
          <FieldSet
            className={className}
            id="associations-section"
            legend={<DinaMessage id="materialSampleAssociationLegend" />}
          >
            {hasAssociations && (
              <ReactTable
                columns={associationColumns}
                defaultSorted={[{ id: "date", desc: true }]}
                data={associations}
                minRows={associations.length}
                showPagination={false}
                className="-striped mb-2"
                // Implement the edit feature:
                ExpanderComponent={() => null}
                expanded={
                  typeof associationToEdit === "object"
                    ? { [associationToEdit?.viewIndex ?? -1]: true }
                    : undefined
                }
                SubComponent={row => (
                  <div className="m-2">
                    <MaterialSampleAssociationSubForm
                      associationToEdit={row.original}
                      onSaveAssociation={saveAssociation}
                      onCancelClick={
                        hasAssociations
                          ? () => setAssociationToEdit(null)
                          : undefined
                      }
                    />
                  </div>
                )}
                sortable={false}
              />
            )}
            {readOnly ? null : !hasAssociations ||
              associationToEdit === "NEW" ? (
              <MaterialSampleAssociationSubForm
                onSaveAssociation={saveAssociation}
                onCancelClick={
                  hasAssociations ? () => setAssociationToEdit(null) : undefined
                }
              />
            ) : (
              <FormikButton
                className="btn btn-primary mb-3 add-new-button"
                buttonProps={() => ({ style: { width: "10rem" } })}
                onClick={() => setAssociationToEdit("NEW")}
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

/** Displays the material sample name and link given the ID. */
export function MaterialSampleLink({ id }) {
  const sampleQuery = useQuery<MaterialSample>({
    path: `collection-api/material-sample/${id}`
  });
  return withResponse(sampleQuery, ({ data: sample }) => (
    <Link href={`/collection/material-sample/view?id=${id}`}>
      <a target="_blank">
        {sample.materialSampleName ||
          sample.dwcOtherCatalogNumbers?.join?.(", ") ||
          id}
      </a>
    </Link>
  ));
}

export interface MaterialSampleAssociationSubFormProps {
  onSaveAssociation: (association: MaterialSampleAssociation) => Promise<void>;
  onCancelClick?: () => void;
  associationToEdit?: MaterialSampleAssociation;
}

export function MaterialSampleAssociationSubForm({
  onSaveAssociation,
  onCancelClick,
  associationToEdit
}: MaterialSampleAssociationSubFormProps) {
  const { enabledFields, initialValues, isTemplate } = useDinaFormContext();

  const { locale } = useDinaIntl();

  const associationsEnabledFields = enabledFields?.filter(it =>
    it.startsWith("association.")
  );

  const associationTemplateInitialValues = enabledFields
    ? initialValues.association
    : undefined;

  /* if template edit/run mode having any association related enabled fields/values,
   or in editing association mode,
  will hide the search button and show the search result list and associated sample input; otherwise vice versus */
  const showSearchAssociatedSampleInit =
    !!associationsEnabledFields?.length ||
    (!!initialValues.association && isTemplate) ||
    (associationToEdit === "NEW" || !associationToEdit ? false : true);

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
  function fieldProps(fieldName: keyof MaterialSampleAssociation) {
    const templateFieldName = `association.${fieldName}`;
    return {
      name: isTemplate ? templateFieldName : fieldName,
      // If the first determination is enabled, then enable multiple determinations:
      templateCheckboxFieldName: templateFieldName,
      // Don't use the prefix for the labels and tooltips:
      customName: fieldName
    };
  }

  const submitAssociation: OnFormikSubmit<any> = async (
    newAssociation,
    formik
  ) => {
    // Return if the sub-form has errors:
    const formErrors = await formik.validateForm();
    if (!isEmpty(formErrors)) {
      formik.setErrors({ ...formik.errors, ...formErrors });
      return;
    }
    await onSaveAssociation(newAssociation);
  };

  return (
    <div onKeyDown={disableEnterToSubmitOuterForm}>
      <FormWrapper
        validationSchema={associationSchema}
        initialValues={
          associationToEdit ?? associationTemplateInitialValues ?? {}
        }
        enabledFields={associationsEnabledFields}
      >
        <div className="row">
          <div className="col-sm-6" id="association">
            <VocabularySelectField
              {...fieldProps("associationType")}
              path="collection-api/vocabulary/associationType"
            />
          </div>
          <div className="col-sm-6">
            <TextField {...fieldProps("remarks")} multiLines={true} />
          </div>
          <AssociatedMaterialSampleSearchBox
            showSearchAssociatedSampleInit={showSearchAssociatedSampleInit}
            {...fieldProps("associatedSample")}
          />
        </div>

        {!isTemplate && (
          <div className="d-flex justify-content-center gap-2">
            <FormikButton
              className="btn btn-primary mb-3 save-button"
              buttonProps={() => ({ style: { width: "10rem" } })}
              onClick={submitAssociation}
            >
              <DinaMessage id={associationToEdit ? "submitBtnText" : "add"} />
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
    </div>
  );
}
