import {
  DinaForm,
  DinaFormSection,
  FieldView,
  FieldWrapper,
  useQuery
} from "common-ui";
import { KitsuResource } from "kitsu";
import { toPairs } from "lodash";
import ReactTable from "react-table";
import { DinaMessage } from "../../../intl/dina-ui-intl";

export interface ManagedAttributesViewerProps {
  /**
   * Map of Managed Attributes values.
   * Key is Managed Attribute UUID and value is the Managed Attribute value object.
   */
  values?: Record<
    string,
    { name?: string; value?: string; assignedValue?: string }
  >;

  /** Function that returns the API find-one path given the Managed Attribute key or ID. */
  managedAttributeApiPath: (key: string) => string;
}

export function ManagedAttributesViewer({
  values,
  managedAttributeApiPath
}: ManagedAttributesViewerProps) {
  const managedAttributeValues = values
    ? toPairs(values).map(([key, mav]) => ({
        key,
        value: mav.value || mav.assignedValue
      }))
    : [];

  return (
    <DinaForm initialValues={managedAttributeValues} readOnly={true}>
      {managedAttributeValues.length ? (
        <div className="row">
          {managedAttributeValues.map((mav, index) => (
            <FieldView
              key={mav.key}
              className="col-6"
              label={
                <ManagedAttributeName
                  managedAttributeApiPath={managedAttributeApiPath}
                  managedAttributeKey={mav.key}
                />
              }
              name={`${index}.value`}
            />
          ))}
        </div>
      ) : (
        <div className="mb-3">
          <DinaMessage id="noManagedAttributeValues" />
        </div>
      )}
    </DinaForm>
  );
}

export interface ManagedAttributeNameProps {
  managedAttributeKey: string;
  managedAttributeApiPath: (key: string) => string;
}

/** Render the name of a ManagedAttribute. */
export function ManagedAttributeName({
  managedAttributeKey,
  managedAttributeApiPath
}: ManagedAttributeNameProps) {
  const { response } = useQuery<KitsuResource & { name: string }>({
    path: managedAttributeApiPath(managedAttributeKey)
  });

  return <>{response?.data?.name ?? managedAttributeKey}</>;
}
