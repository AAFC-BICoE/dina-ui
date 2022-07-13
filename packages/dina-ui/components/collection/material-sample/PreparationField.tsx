import {
  AutoSuggestTextField,
  DateField,
  FieldSet,
  FieldSpy,
  filterBy,
  ResourceSelectField,
  TextField
} from "common-ui";
import { InputResource } from "kitsu";
import { Protocol } from "packages/dina-ui/types/collection-api/resources/Protocol";
import { PersonSelectField } from "../..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  MaterialSample,
  PreparationMethod,
  PreparationType,
  Vocabulary
} from "../../../types/collection-api";

export interface PreparationFieldProps {
  className?: string;
  namePrefix?: string;
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
  "preparationProtocol"
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
  preparationProtocol: Object.seal({ id: null, type: "protocol" })
});

export function PreparationField({
  className,
  namePrefix = "",
  id = "preparations-section"
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
      id={id}
      legend={<DinaMessage id="preparations" />}
    >
      <div className="row">
        <div className="col-md-6">
          <FieldSpy<string> fieldName="group">
            {group => (
              <div>
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
                <ResourceSelectField<PreparationMethod>
                  {...fieldProps("preparationMethod")}
                  model="collection-api/preparation-method"
                  optionLabel={it => it.name}
                  readOnlyLink="/collection/preparation-method/view?id="
                  className="preparation-method"
                  filter={input =>
                    group
                      ? {
                          ...filterBy(["name"])(input),
                          group: { EQ: `${group}` }
                        }
                      : { ...filterBy(["name"])(input) }
                  }
                  key={group}
                  tooltipLink="https://aafc-bicoe.github.io/dina-documentation/#preparation-method"
                  tooltipLinkText="fromDinaUserGuide"
                />
              </div>
            )}
          </FieldSpy>
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
          <FieldSpy<string> fieldName="group">
            {group => (
              <ResourceSelectField<Protocol>
                {...fieldProps("preparationProtocol")}
                model="collection-api/protocol"
                optionLabel={it => it.name}
                readOnlyLink="/collection/protocol/view?id="
                className="protocol"
                filter={input =>
                  group
                    ? {
                        ...filterBy(["name"])(input),
                        group: { EQ: `${group}` }
                      }
                    : { ...filterBy(["name"])(input) }
                }
                key={group}
              />
            )}
          </FieldSpy>
        </div>
      </div>
    </FieldSet>
  );
}
