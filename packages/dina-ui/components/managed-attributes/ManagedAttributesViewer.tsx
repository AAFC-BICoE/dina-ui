import { DinaForm, FieldView, useApiClient, useIsMounted } from "common-ui";
import { toPairs } from "lodash";
import { ManagedAttribute } from "../../types/collection-api";
import { useEffect, useState } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";

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
  const { apiClient } = useApiClient();
  const [allAttrKeyNameMap, setAllAttrKeyNameMap] = useState<{
    [key: string]: string;
  }>({});
  const isMounted = useIsMounted();
  // Call API to fetch all ManagedAttributes
  useEffect(() => {
    async function fetchAllManagedAttributes() {
      const { data } = await apiClient.get<ManagedAttribute[]>(
        `${managedAttributeApiPath}?fields=key,name`,
        {}
      );
      const attrKeyNameMap = data.reduce(
        (accu, obj) => ({
          ...accu,
          [obj.key]: obj.name
        }),
        {} as { [key: string]: string }
      );
      if (isMounted.current) {
        setAllAttrKeyNameMap(attrKeyNameMap);
      }
    }
    fetchAllManagedAttributes();
  }, []);

  const managedAttributeValues = (
    values
      ? toPairs(values).map(([key, mav]) => ({
          key,
          value: mav
        }))
      : []
  ).map((item) => ({
    ...item,
    name: allAttrKeyNameMap[item.key]
  }));

  return (
    <DinaForm initialValues={managedAttributeValues} readOnly={true}>
      {managedAttributeValues.length ? (
        <div className="row">
          {managedAttributeValues.map((mav, index) => {
            return (
              <FieldView
                key={mav.key}
                className="col-6"
                label={mav.name}
                name={`${index}.value`}
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
