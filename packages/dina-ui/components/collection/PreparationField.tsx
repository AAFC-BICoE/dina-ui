import {
  AutoSuggestTextField,
  DateField,
  FieldSet,
  filterBy,
  ResourceSelectField,
  TextField
} from "common-ui";
import { Field } from "formik";
import { InputResource } from "kitsu";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/agent-api";
import {
  MaterialSample,
  PreparationType,
  Vocabulary
} from "../../types/collection-api";

export interface PreparationFieldProps {
  className?: string;
  namePrefix?: string;
}

/**
 * List of field names in the PreparationField component.
 * This should be updated when fields are added or removed in the PreparationField component.
 */
export const PREPARATION_FIELDS = [
  "preparationType",
  "preparationDate",
  "preparationMethod",
  "preparedBy",
  "preparationRemarks",
  "dwcDegreeOfEstablishment"
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
  preparationMethod: null
});

export function PreparationField({
  className,
  namePrefix = ""
}: PreparationFieldProps) {
  const { locale } = useDinaIntl();

  /** Applies name prefix to field props */
  function fieldProps(fieldName: string) {
    return {
      name: `${namePrefix}${fieldName}`,
      // Don't use the prefix for the labels and tooltips:
      customName: fieldName
    };
  }

  return (
    <FieldSet
      className={className}
      id="preparations-section"
      legend={<DinaMessage id="preparations" />}
    >
      <div className="row">
        <div className="col-md-6">
          <Field name={`${namePrefix}preparationType`}>
            {({ form: { values } }) => (
              <ResourceSelectField<PreparationType>
                {...fieldProps("preparationType")}
                model="collection-api/preparation-type"
                optionLabel={it => it.name}
                readOnlyLink="/collection/preparation-type/view?id="
                className="preparation-type"
                filter={input =>
                  values.group
                    ? {
                        ...filterBy(["name"])(input),
                        group: { EQ: `${values.group}` }
                      }
                    : { ...filterBy(["name"])(input) }
                }
                key={values.group}
              />
            )}
          </Field>
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
            tooltipLink="https://dwc.tdwg.org/terms/#dwc:establishmentMeans"
          />
          <ResourceSelectField<Person>
            {...fieldProps("preparedBy")}
            filter={filterBy(["displayName"])}
            model="agent-api/person"
            optionLabel={person => person.displayName}
            readOnlyLink="/person/view?id="
          />
          <DateField {...fieldProps("preparationDate")} />
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
        </div>
      </div>
    </FieldSet>
  );
}
