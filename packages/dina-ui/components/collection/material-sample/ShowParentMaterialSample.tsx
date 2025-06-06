import { FieldSet, filterBy, useQuery } from "common-ui";
import { InputResource } from "kitsu";
import _ from "lodash";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  ManagedAttribute,
  MaterialSample,
  SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME
} from "../../../types/collection-api";
import { MATERIAL_SAMPLE_ATTR_NAMES } from "./ShowParentAttributesField";

interface ShowParentMaterialSampleProps {
  className?: string;
  id?: string;
  attrList?: string[];
  materialSample?: InputResource<MaterialSample>;
}
export function ShowParentMaterialSample({
  className,
  id,
  attrList,
  materialSample
}: ShowParentMaterialSampleProps): JSX.Element {
  const { locale } = useDinaIntl();
  const { formatMessage } = useDinaIntl();

  const parentMaterialSample: MaterialSample =
    (materialSample?.parentMaterialSample ?? {}) as MaterialSample;
  const { response: attrResp } = useQuery<ManagedAttribute[]>({
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

  /**
   * Display the human readable value.
   *
   * @param value Can be any type, it will check can display it as a human readable string.
   * @returns A string.
   */
  function getHumanReadableString(value) {
    if (value === undefined || value === null) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    } else if (typeof value === "boolean") {
      return formatMessage(value ? "true" : "false");
    } else if (Array.isArray(value)) {
      return value.filter((item) => item !== "").join(", ");
    } else {
      return value.toString(); // Convert to string for other types
    }
  }

  return (
    <FieldSet
      className={className}
      id={id}
      legend={<DinaMessage id="showParentAttributes" />}
      componentName={SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME}
      sectionName="parent-attributes-section"
    >
      <div className="d-flex flex-wrap w-100">
        {attrList?.map((attr, idx) => {
          if (MATERIAL_SAMPLE_ATTR_NAMES.includes(attr)) {
            const value = getHumanReadableString(
              _.get(parentMaterialSample, attr)
            );
            const label =
              formatMessage(`field_${attr}` as any) ??
              formatMessage(attr as any) ??
              attr;

            return (
              <div
                key={idx}
                className="flex-grow-0 flex-shrink-0 w-50 align-items-center mb-2"
              >
                <label>
                  <div className="field-label label-col me-2">
                    <strong>
                      <div>{label}</div>
                    </strong>
                  </div>
                </label>
                <div className="me-2">{value}</div>
              </div>
            );
          } else {
            // Find the managed attribute that this matches.
            const foundManagedAttribute = attrResp?.data?.find(
              (item) => item.key === attr
            );
            if (!foundManagedAttribute) {
              return;
            }

            const label =
              foundManagedAttribute?.multilingualDescription?.descriptions?.find(
                (description) => description.lang === locale
              )?.desc ?? attr;

            const value = getHumanReadableString(
              parentMaterialSample?.organism?.map((item) => {
                const foundValue = item?.managedAttributes?.[attr];
                if (foundValue === undefined) {
                  return "";
                }

                // If it's a boolean managed attribute, display it with translations.
                if (foundManagedAttribute.vocabularyElementType === "BOOL") {
                  return item?.managedAttributes?.[attr] === "true"
                    ? getHumanReadableString(true)
                    : getHumanReadableString(false);
                }

                return foundValue;
              }) ?? ""
            );

            return (
              <div
                key={idx}
                className="flex-grow-0 flex-shrink-0 w-50 align-items-center mb-2"
              >
                <label>
                  <div className="field-label label-col me-2">
                    <strong>
                      <div>{label}</div>
                    </strong>
                  </div>
                </label>
                <div className="me-2">{value}</div>
              </div>
            );
          }
        })}
      </div>
    </FieldSet>
  );
}
