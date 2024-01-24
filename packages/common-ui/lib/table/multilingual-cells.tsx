import { capitalize, get } from "lodash";
import { useContext } from "react";
import { FieldHeader } from "../field-header/FieldHeader";
import { intlContext } from "../intl/IntlSupport";

/**
 * Used for multilingual fields which contain multiple translations of an item.
 * 
 * This function should not be exported, see the titleCell and descriptionCell for exportable
 * versions.
 * 
 * @param displayAll If true, display all languages available. Used for revisions to display all the
 *    changes.
 * @param accessorKey To find the value in the DinaForm.
 * @param type Short hand version of what's being accessed (ex. desc)
 * @param className Long hand version of what's being accessed (ex. description) - Type is used
 *    if not provided.
 */
function multilingualFieldCell(displayAll: boolean, accessorKey: string, type: string, className?: string) {
  if (!className) {
    className = type;
  }

  return displayAll ? {
    cell: ({ row: { original } }) => {
      return original.value?.[`${className}s`]?.map(
        (field, index) =>
        field?.[type] && (
            <div className="pb-2" key={index}>
              {field?.[type]} {languageBadge(field?.lang)}
            </div>
          )
      ) ?? null
    },
    accessorKey,
    enableSorting: false
  } : {
    cell: ({ row: { original } }) => {
      const { locale } = useContext(intlContext);

      // Retrieve the current language being used.
      const language = locale;

      // Get the multilingual field data provided.
      const multilingualField: any | null = get(
        original,
        accessorKey
      );

      // If no data is provided, just leave the cell blank.
      if (
        multilingualField == null ||
        multilingualField[`${className}s`] == null ||
        multilingualField[`${className}s`].length === 0
      ) {
        return <div />;
      }

      // Remove any blank entries.
      const fieldPairs = multilingualField[`${className}s`].filter(
        (fieldItem) => fieldItem[`${type}`] !== ""
      );

      // Loop through all of the entries provided, the preferred one is always the currently used language.
      for (const fieldPair of fieldPairs) {
        if (fieldPair.lang === language) {
          return (
            <div>
              <span className={`${className} list-inline-item`}>{fieldPair[`${type}`]}</span>
              {languageBadge(fieldPair.lang)}
            </div>
          );
        }
      }

      // Preferred language could not be found above. Use another language and make sure it's indicated.
      // There is also the possibility that this is blank.
      return fieldPairs.length !== 0 && fieldPairs[0] !== null ? (
        <div>
          <span className={`${className} list-inline-item`}>{fieldPairs[0][`${type}`]}</span>
          {languageBadge(fieldPairs[0].lang)}
        </div>
      ) : (
        <></>
      );
    },
    accessorKey,
    header: () => <FieldHeader name={`multilingual${capitalize(className)}`} />
  };
}

/**
 * Generate the language badge using the MultilingualDescription or MultilingualTitle language
 * string.
 *
 * This badge will automatically get translated as well.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames
 * @param language MultilingualDescription or MultilingualTitle lang string.
 * @returns Language description or title badge element.
 */
function languageBadge(language) {
  const { locale } = useContext(intlContext);

  return (
    <span className="badge">
      {capitalize(
        new Intl.DisplayNames(locale, { type: "language" }).of(language)
      )}
    </span>
  );
}

export const descriptionCell = (displayAll: boolean, accessorKey: string) => multilingualFieldCell(displayAll, accessorKey, "desc", "description");
export const titleCell = (displayAll: boolean, accessorKey: string) => multilingualFieldCell(displayAll, accessorKey, "title");