import {
  CheckBoxField,
  CheckBoxFieldProps,
  CheckBoxProps,
  FieldSet,
  filterBy,
  useQuery
} from "common-ui";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  ManagedAttribute,
  SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME
} from "../../../types/collection-api";
import { FieldArray } from "formik";

export interface ShowParentAttributesFieldProps {
  className?: string;
  namePrefix?: string;
  id?: string;
}

export function ShowParentAttributesField({
  className,
  namePrefix = "",
  id = SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME
}: ShowParentAttributesFieldProps) {
  const fieldPropsList = [
    "materialSampleName",
    "preservationType",
    "preparationFixative",
    "preparationMaterials",
    "preparationSubstrate",
    "preparationDate",
    "preparationRemarks",
    "description",
    "dwcDegreeOfEstablishment",
    "barcode",
    "materialSampleState",
    "materialSampleRemarks",
    "notPubliclyReleasableReason",
    "dwcOtherCatalogNumbers",
    "tag",
    "organismsIndividualEntry",
    "useTargetOrganism",
    "publiclyReleasable",
    "useNextSequence",
    "isRestricted"
  ].map((fieldName) => fieldProps(fieldName));

  const { locale } = useDinaIntl();
  const { formatMessage } = useDinaIntl();

  const { loading: attrLoading, response: attrResp } = useQuery<
    ManagedAttribute[]
  >({
    path: "collection-api/managed-attribute",
    filter: filterBy([], {
      extraFilters: [
        {
          selector: "managedAttributeComponent",
          comparison: "==",
          arguments: "ORGANISM"
        }
      ]
    })(""),
    page: { limit: 1000 }
  });

  if (attrResp) {
    attrResp.data.forEach((attr) => {
      const label =
        attr.multilingualDescription?.descriptions?.find(
          (description) => description.lang === locale
        )?.desc ?? attr.name;
      fieldPropsList.push(
        fieldProps(`organism.managedAttributes.${attr.key}`, label)
      );
    });
  }

  /** Applies name prefix to field props */
  function fieldProps(fieldName: string, label?: string | null) {
    return {
      name: `${namePrefix}parentAttributes.${fieldName}`,
      // Don't use the prefix for the labels and tooltips:
      customName: fieldName,
      label
    };
  }

  function splitArray(
    fieldArr: { name: string; customName?: string; label?: string | null }[]
  ) {
    const chunkSize = 3;
    const result: {
      name: string;
      customName?: string;
      label?: string | null;
    }[][] = [];
    for (let i = 0; i < fieldArr.length; i += chunkSize) {
      const chunk = fieldArr.slice(i, i + chunkSize);
      result.push(chunk);
    }
    return result.map((chunk, cnkIdx) => (
      <div key={cnkIdx} className="row">
        {chunk.map((fieldProp) => (
          <div className={`col-md-${12 / chunkSize}`} key={fieldProp.name}>
            <CheckBoxField {...fieldProp} disableTemplateCheckbox={true} />
          </div>
        ))}
      </div>
    ));
  }

  return (
    <FieldSet
      className={className}
      id={id}
      legend={<DinaMessage id="showParentAttributes" />}
      componentName={SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME}
      sectionName="parent-attributes-section"
    >
      {splitArray(fieldPropsList)}
    </FieldSet>
  );
}
