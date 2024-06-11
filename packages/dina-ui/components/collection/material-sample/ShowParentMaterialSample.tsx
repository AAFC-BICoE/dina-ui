import { FieldSet, filterBy, useQuery } from "common-ui";
import { InputResource } from "kitsu";
import { get } from "lodash";
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
      return new Intl.ListFormat(navigator.language, {
        style: "short",
        type: "unit"
      }).format(value); // Join elements with comma and space
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
              get(parentMaterialSample, attr)
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
            const attributes: string[][] = [];
            for (const ogsm of parentMaterialSample?.organism ?? []) {
              for (const pair of Object.entries(
                ogsm?.managedAttributes ?? {}
              )) {
                const foundAttr = attrResp?.data?.find(
                  (item) => item.key === pair[0]
                );
                const label =
                  foundAttr?.multilingualDescription?.descriptions?.find(
                    (description) => description.lang === locale
                  )?.desc ?? pair[0];
                const value = pair[1];
                attributes.push([label, value]);
              }
            }
            return (
              <>
                {attributes.map((pair, idx2) => (
                  <div
                    key={idx2}
                    className="flex-grow-0 flex-shrink-0 w-50 align-items-center mb-2"
                  >
                    <label>
                      <div className="field-label label-col me-2">
                        <strong>
                          <div>{pair[0]}</div>
                        </strong>
                      </div>
                    </label>
                    <div className="me-2">{pair[1]}</div>
                  </div>
                ))}
              </>
            );
          }
        })}
      </div>
    </FieldSet>
  );
}
