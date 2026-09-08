import { DinaForm, FieldView } from "common-ui";
import _ from "lodash";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import {
  getManagedAttributeTitle,
  getManagedAttributeTooltipText
} from "./ManagedAttributeField";
import { useBulkManagedAttributes } from "./useBulkManagedAttributes";

export interface ManagedAttributesViewerProps {
  /**
   * Map of Managed Attributes values.
   * Key is Managed Attribute UUID and value is the Managed Attribute value object.
   */
  values?: Record<string, string | null | undefined> | null;
  managedAttributeApiPath: string;
  managedAttributeComponent?: string;
  controlledVocabularyId?: string;
}

/**
 * @deprecated Use ControlledVocabularyViewer instead. This component is being kept for backward compatibility.
 */
export function ManagedAttributesViewer({
  values,
  managedAttributeApiPath,
  managedAttributeComponent,
  controlledVocabularyId
}: ManagedAttributesViewerProps) {
  const { locale, formatMessage } = useDinaIntl();

  const managedAttributeKeys = values ? Object.keys(values) : [];

  const { data: fetchedAttributes } = useBulkManagedAttributes({
    baseApiPath: managedAttributeApiPath,
    dinaComponent: managedAttributeComponent,
    keys: managedAttributeKeys,
    isControlledVocabulary: !!controlledVocabularyId,
    controlledVocabularyId,
    disabled: !managedAttributeKeys.length
  });

  const allAttrKeyNameMap = (fetchedAttributes ?? []).reduce(
    (accu, obj) => ({
      ...accu,
      [obj.key]: {
        name: getManagedAttributeTitle(obj as any, locale),
        multilingualDescription: obj.multilingualDescription
      }
    }),
    {} as { [key: string]: Record<string, string> }
  );

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
