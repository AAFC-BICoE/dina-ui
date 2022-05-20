import {
  AutoSuggestTextField,
  DateField,
  FieldSet,
  FieldSpy,
  filterBy,
  ResourceSelectField,
  TextField,
  useDinaFormContext
} from "common-ui";
import { Field } from "formik";
import { InputResource } from "kitsu";
import { AttachmentsField, BulkEditTabWarning, PersonSelectField } from "../..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  MaterialSample,
  PreparationType,
  Vocabulary
} from "../../../types/collection-api";
import { AllowAttachmentsConfig } from "../../object-store";

export interface PreparationFieldProps {
  className?: string;
  namePrefix?: string;
  attachmentsConfig?: AllowAttachmentsConfig;
  id?: string;
}

/**
 * List of field names in the PreparationField component.
 * This should be updated when fields are added or removed in the PreparationField component.
 */
export const PREPARATION_FIELDS = [
  "preparationType",
  "preparationDate",
  "preparationMethod",
  "preservationType",
  "preparationFixative",
  "preparationMaterials",
  "preparationSubstrate",
  "preparedBy",
  "preparationRemarks",
  "dwcDegreeOfEstablishment",
  "preparationAttachment"
] as const;

/** Blank values for all Preparation fields. */
export const BLANK_PREPARATION: Required<
  Pick<InputResource<MaterialSample>, typeof PREPARATION_FIELDS[number]>
> = Object.seal({
  preparationType: Object.seal({ id: null, type: "preparation-type" }),
  preparationDate: null,
  preparedBy: Object.seal({ id: null, type: "person" }),
  preparationRemarks: null,
  dwcDegreeOfEstablishment: null,
  preparationMethod: null,
  preservationType: null,
  preparationFixative: null,
  preparationMaterials: null,
  preparationSubstrate: null,
  preparationAttachment: []
});

export function PreparationField({
  className,
  namePrefix = "",
  attachmentsConfig = { allowExisting: true, allowNew: true },
  id = "preparations-section"
}: PreparationFieldProps) {
  const { locale } = useDinaIntl();
  const { initialValues } = useDinaFormContext();

  /** Applies name prefix to field props */
  function fieldProps(fieldName: string) {
    return {
      name: `${namePrefix}${fieldName}`,
      // Don't use the prefix for the labels and tooltips:
      customName: fieldName
    };
  }

  const attachmentsField = "preparationAttachment";

  return (
    <FieldSet
      className={className}
      id={id}
      legend={<DinaMessage id="preparations" />}
    >
      <div className="row">
        <div className="col-md-6">
          <FieldSpy<string> fieldName="group">
            {group => (
              <ResourceSelectField<PreparationType>
                {...fieldProps("preparationType")}
                model="collection-api/preparation-type"
                optionLabel={it => it.name}
                readOnlyLink="/collection/preparation-type/view?id="
                className="preparation-type"
                filter={input =>
                  group
                    ? {
                        ...filterBy(["name"])(input),
                        group: { EQ: `${group}` }
                      }
                    : { ...filterBy(["name"])(input) }
                }
                key={group}
                tooltipLink="https://aafc-bicoe.github.io/dina-documentation/#preparation-type"
                tooltipLinkText="fromDinaUserGuide"
              />
            )}
          </FieldSpy>
          <AutoSuggestTextField<MaterialSample>
            {...fieldProps("preparationMethod")}
            query={(search, ctx) => ({
              path: "collection-api/material-sample",
              filter: {
                ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
                rsql: `preparationMethod==${search}*`
              }
            })}
            alwaysShowSuggestions={true}
            suggestion={sample => sample?.preparationMethod ?? ""}
            tooltipLink="https://aafc-bicoe.github.io/dina-documentation/#preparation-method"
          />
          <TextField
            {...fieldProps("preservationType")}
            tooltipLink="https://aafc-bicoe.github.io/dina-documentation/#preservation-type"
            tooltipLinkText="fromDinaUserGuide"
          />
          <TextField {...fieldProps("preparationFixative")} />
          <TextField {...fieldProps("preparationMaterials")} />
          <TextField {...fieldProps("preparationSubstrate")} />
        </div>
        <div className="col-md-6">
          <TextField {...fieldProps("preparationRemarks")} multiLines={true} />
          <AutoSuggestTextField<Vocabulary>
            {...fieldProps("dwcDegreeOfEstablishment")}
            query={() => ({
              path: "collection-api/vocabulary/degreeOfEstablishment"
            })}
            suggestion={vocabElement =>
              vocabElement?.vocabularyElements?.map(
                it => it?.labels?.[locale] ?? ""
              ) ?? ""
            }
            alwaysShowSuggestions={true}
            tooltipLink="https://dwc.tdwg.org/terms/#dwc:establishmentMeans"
          />
          <PersonSelectField {...fieldProps("preparedBy")} />
          <DateField {...fieldProps("preparationDate")} />
        </div>
      </div>
      <div>
        <AttachmentsField
          {...fieldProps(attachmentsField)}
          title={<DinaMessage id="preparationProtocols" />}
          allowNewFieldName="attachmentsConfig.allowNew"
          allowExistingFieldName="attachmentsConfig.allowExisting"
          id="preparation-protocols-section"
          allowAttachmentsConfig={attachmentsConfig}
          attachmentPath={`collection-api/${initialValues.type}/${initialValues.id}/preparationAttachment`}
          // Wrap in the bulk edit tab warning in case this is bulk edit mode:
          wrapContent={content => (
            <BulkEditTabWarning
              targetType="material-sample"
              fieldName={attachmentsField}
            >
              {content}
            </BulkEditTabWarning>
          )}
        />
      </div>
    </FieldSet>
  );
}
