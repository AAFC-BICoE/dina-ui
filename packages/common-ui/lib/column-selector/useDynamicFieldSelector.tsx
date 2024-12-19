import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { ESIndexMapping } from "../list-page/types";
import { compact, startCase } from "lodash";

function useDynamicFieldSelector() {
  const { messages, formatMessage } = useDinaIntl();

  function getFormattedFunctionField(
    functionFieldPath: string,
    indexMappings?: ESIndexMapping[]
  ) {
    const pathParts = functionFieldPath.split("/");
    if (pathParts.length >= 3 && pathParts[0] === "columnFunction") {
      const functionName = pathParts[2];
      const paramStr = pathParts.length > 3 ? pathParts[3] : undefined;
      const paramObjects = compact(
        paramStr
          ?.split("+")
          .map((field) =>
            indexMappings?.find((mapping) => mapping.value === field)
          )
      );
      const formattedParamStr =
        paramObjects && paramObjects.length > 0
          ? "(" +
            paramObjects
              ?.map(
                (field) =>
                  (field.parentName
                    ? (messages[field.parentName]
                        ? formatMessage(field.parentName as any)
                        : startCase(field.parentName)) + " "
                    : "") +
                  (messages[field.label]
                    ? formatMessage(field.label as any)
                    : startCase(field.label))
              )
              .join(" + ") +
            ")"
          : "";
      return formatMessage(functionName as any) + formattedParamStr;
    }
  }

  return { getFormattedFunctionField };
}

export default useDynamicFieldSelector;
