import { DinaForm, FieldView, useApiClient, useIsMounted } from "common-ui";
import _ from "lodash";
import { ManagedAttribute } from "../../types/collection-api";
import { useEffect, useState } from "react";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { getManagedAttributeTooltipText } from "./ManagedAttributeField";

export interface ManagedAttributesViewerProps {
  /**
   * Map of Managed Attributes values.
   * Key is Managed Attribute UUID and value is the Managed Attribute value object.
   */
  values?: Record<string, string | null | undefined> | null;
  managedAttributeApiPath: string;
}

export function ManagedAttributesViewer({
  values,
  managedAttributeApiPath
}: ManagedAttributesViewerProps) {
  const { locale, formatMessage } = useDinaIntl();
  const { apiClient } = useApiClient();
  const [allAttrKeyNameMap, setAllAttrKeyNameMap] = useState<{
    [key: string]: Record<string, string>;
  }>({});
  const isMounted = useIsMounted();
  // Call API to fetch all ManagedAttributes
  useEffect(() => {
    async function fetchAllManagedAttributes() {
      try {
        const { data } = await apiClient.get<ManagedAttribute[]>(
          `${managedAttributeApiPath}`,
          {}
        );
        const attrKeyNameMap = data.reduce(
          (accu, obj) => ({
            ...accu,
            [obj.key]: {
              name: obj.name,
              multilingualDescription: obj.multilingualDescription
            }
          }),
          {} as { [key: string]: {} }
        );

        if (isMounted.current) {
          setAllAttrKeyNameMap(attrKeyNameMap);
        }
      } catch (error) {
        // Handle the error here, e.g., log it or display an error message.
        console.error(error);
      }
    }
    fetchAllManagedAttributes();
  }, []);
  const managedAttributeValues = (
    values
      ? _.toPairs(values).map(([key, mav]) => ({
          key,
          value: mav
        }))
      : []
  )
    .map((item) => ({
      ...item,
      name: allAttrKeyNameMap[item.key]?.name,
      multilingualDescription:
        allAttrKeyNameMap[item.key]?.multilingualDescription
    }))
    .sort((a, b) =>
      a?.name?.localeCompare(b?.name, locale, { sensitivity: "base" })
    );

  const managedAttributesInitialValues = managedAttributeValues?.reduce(
    (prev, curr) => ({ ...prev, [curr.key]: curr.value }),
    {}
  );
  return (
    <DinaForm initialValues={managedAttributesInitialValues}>
      {managedAttributeValues?.length ? (
        <div className="row">
          {managedAttributeValues?.map((mav) => {
            const tooltipText = getManagedAttributeTooltipText(
              mav as any,
              locale,
              formatMessage
            );
            return (
              <FieldView
                className="col-6"
                customName={mav.name}
                name={`${mav.key}`}
                key={mav.key}
                tooltipOverride={tooltipText}
                startCaseLabel={false}
              />
            );
          })}
        </div>
      ) : (
        <div className="mb-3">
          <DinaMessage id="noManagedAttributeValues" />
        </div>
      )}
    </DinaForm>
  );
}
