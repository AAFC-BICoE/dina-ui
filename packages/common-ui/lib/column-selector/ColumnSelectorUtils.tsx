import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { FieldHeader } from "..";

export function getQueryBuilderColumns(parameters: any[], formatMessage) {
  parameters.forEach((queryParameter) => {
    const flattenedParameter = flattenObject(queryParameter);
    Object.keys(flattenedParameter).forEach((paramKey) => {
      if (paramKey.includes("data.attributes")) {
        const dataAttributesIndex = paramKey.indexOf("data.attributes");
        const queryKey = paramKey.slice(dataAttributesIndex);
        if (queryKey.includes("managedAttributes")) {
          const attributeColumn = {
            header: () => (
              <FieldHeader
                name={formatMessage("managedAttribute", {
                  name: "integer 1"
                })}
              />
            ),
            accessorKey: "data.attributes.managedAttributes.integer_1"
            // isKeyword: true
          };
        }
      } else if (paramKey.includes("included.attributes")) {
        const includedAttributesIndex = paramKey.indexOf("included.attributes");
        let includedType: string = "";
        for (const [key, value] of Object.entries<string>(flattenedParameter)) {
          if (key.includes("included.type")) {
            includedType = value;
          }
        }
        const queryKey = paramKey.slice(includedAttributesIndex);
      }
    });
  });
}

/**
 * Return a flattened object with nested keys concatenated with "."
 * @param ob
 * @returns Flattened object
 */
function flattenObject(ob) {
  const toReturn = {};

  for (const i in ob) {
    if (!ob.hasOwnProperty(i)) continue;

    if (typeof ob[i] === "object" && ob[i] !== null) {
      const flatObject = flattenObject(ob[i]);
      for (const x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) continue;

        toReturn[i + "." + x] = flatObject[x];
      }
    } else {
      toReturn[i] = ob[i];
    }
  }
  return toReturn;
}
