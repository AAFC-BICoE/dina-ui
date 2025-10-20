import {
  AutoSuggestTextField,
  DateField,
  FieldSet,
  FieldSpy,
  ResourceSelectField,
  SimpleSearchFilterBuilder,
  TextField
} from "common-ui";
import { InputResource } from "kitsu";
import { Protocol } from "packages/dina-ui/types/collection-api/resources/Protocol";
import { ManagedAttributesEditor, PersonSelectField } from "../..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  MaterialSample,
  PreparationMethod,
  PREPARATIONS_COMPONENT_NAME,
  PreparationType,
  Vocabulary
} from "../../../types/collection-api";
import _ from "lodash";

export interface PreparationFieldProps {
  className?: string;
  namePrefix?: string;
  id?: string;
  visibleManagedAttributeKeys?: string[];
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
  "preparationProtocol",
  "preparationManagedAttributes"
] as const;

/** Blank values for all Preparation fields. */
export const BLANK_PREPARATION: Required<
  Pick<InputResource<MaterialSample>, (typeof PREPARATION_FIELDS)[number]>
> = Object.seal({
  preparationType: Object.seal({ id: null, type: "preparation-type" }),
  preparationDate: null,
  preparedBy: [],
  preparationRemarks: null,
  dwcDegreeOfEstablishment: null,
  preparationMethod: Object.seal({ id: null, type: "preparation-method" }),
  preservationType: null,
  preparationFixative: null,
  preparationMaterials: null,
  preparationSubstrate: null,
  preparationProtocol: Object.seal({ id: null, type: "protocol" }),
  preparationManagedAttributes: {}
});

export function PreparationField({
  className,
  namePrefix = "",
  id = PREPARATIONS_COMPONENT_NAME,
  visibleManagedAttributeKeys
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
      componentName={PREPARATIONS_COMPONENT_NAME}
      sectionName="general-section"
    >
      <div className="row">
        <div className="col-md-6">
          <FieldSpy<string> fieldName="group">
            {(group) => (
              <div>
                <ResourceSelectField<PreparationType>
                  {...fieldProps("preparationType")}
                  model="collection-api/preparation-type"
                  optionLabel={(it) => it.name}
                  readOnlyLink="/collection/preparation-type/view?id="
                  className="preparation-type"
                  filter={(searchValue: string) =>
                    SimpleSearchFilterBuilder.create<PreparationType>()
                      .searchFilter("name", searchValue)
                      .whereProvided("group", "EQ", group)
                      .build()
                  }
                  tooltipLink="https://aafc-bicoe.github.io/dina-documentation/#preparation-type"
                  tooltipLinkText="fromDinaUserGuide"
                />
                <ResourceSelectField<PreparationMethod>
                  {...fieldProps("preparationMethod")}
                  model="collection-api/preparation-method"
                  optionLabel={(it) => it.name}
                  readOnlyLink="/collection/preparation-method/view?id="
                  className="preparation-method"
                  filter={(searchValue: string) =>
                    SimpleSearchFilterBuilder.create<PreparationMethod>()
                      .searchFilter("name", searchValue)
                      .whereProvided("group", "EQ", group)
                      .build()
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
          <TextField
            {...fieldProps("preparationFixative")}
            tooltipLink="https://aafc-bicoe.github.io/dina-documentation/#preparation-fixative"
            tooltipLinkText="fromDinaUserGuide"
          />
          <TextField
            {...fieldProps("preparationMaterials")}
            tooltipLink="https://aafc-bicoe.github.io/dina-documentation/#preparation-materials"
            tooltipLinkText="fromDinaUserGuide"
          />
          <TextField
            {...fieldProps("preparationSubstrate")}
            tooltipLink="https://aafc-bicoe.github.io/dina-documentation/#preparation-substrate"
            tooltipLinkText="fromDinaUserGuide"
          />
        </div>
        <div className="col-md-6">
          <TextField {...fieldProps("preparationRemarks")} multiLines={true} />
          <AutoSuggestTextField<Vocabulary>
            {...fieldProps("dwcDegreeOfEstablishment")}
            jsonApiBackend={{
              query: () => ({
                path: "collection-api/vocabulary2/degreeOfEstablishment"
              }),
              option: (vocabElement) =>
                _.compact(
                  vocabElement?.vocabularyElements?.map(
                    (it) =>
                      _.find(
                        it?.multilingualTitle?.titles || [],
                        (item) => item.lang === locale
                      )?.title ||
                      it.name ||
                      ""
                  ) ?? []
                )
            }}
            blankSearchBackend={"json-api"}
            tooltipLink="https://dwc.tdwg.org/terms/#dwc:establishmentMeans"
          />
          <PersonSelectField {...fieldProps("preparedBy")} isMulti={true} />
          <DateField {...fieldProps("preparationDate")} />
          <FieldSpy<string> fieldName="group">
            {(group) => (
              <ResourceSelectField<Protocol>
                {...fieldProps("preparationProtocol")}
                model="collection-api/protocol"
                optionLabel={(it) => it.name}
                readOnlyLink="/collection/protocol/view?id="
                className="protocol"
                filter={(searchValue: string) =>
                  SimpleSearchFilterBuilder.create<Protocol>()
                    .searchFilter("name", searchValue)
                    .whereProvided("group", "EQ", group)
                    .build()
                }
                key={group}
              />
            )}
          </FieldSpy>
        </div>
      </div>
      <div className="row">
        <div className="col-md-12">
          <ManagedAttributesEditor
            valuesPath="preparationManagedAttributes"
            managedAttributeApiPath="collection-api/managed-attribute"
            managedAttributeComponent="PREPARATION"
            fieldSetProps={{
              id,
              legend: <DinaMessage id="preparationManagedAttributes" />,
              componentName: PREPARATIONS_COMPONENT_NAME,
              sectionName: "preparations-managed-attributes-section"
            }}
            managedAttributeOrderFieldName="preparationManagedAttributesOrder"
            visibleAttributeKeys={visibleManagedAttributeKeys}
            disableClearButton={true}
          />
        </div>
      </div>
    </FieldSet>
  );
}
