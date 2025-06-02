import { capitalize, get } from "lodash";
import { useContext } from "react";
import { FieldHeader } from "../field-header/FieldHeader";
import { intlContext } from "../intl/IntlSupport";

interface MultilingualPair {
  lang: string;
  value: string;
}

function getPreferredPair(
  original: any,
  accessorKey: string,
  type: string,
  className: string
): MultilingualPair | undefined {
  const { locale } = useContext(intlContext);

  // Get the multilingual field data provided.
  const multilingualField: any | null = get(original, accessorKey);

  // If no data is provided, just leave the cell blank.
  if (
    multilingualField == null ||
    multilingualField[`${className}s`] == null ||
    multilingualField[`${className}s`].length === 0
  ) {
    return undefined;
  }

  // Remove any blank entries.
  const fieldPairs = multilingualField[`${className}s`].filter(
    (fieldItem) => fieldItem[`${type}`] !== ""
  );

  // Loop through all of the entries provided, the preferred one is always the currently used language.
  for (const fieldPair of fieldPairs) {
    if (fieldPair.lang === locale) {
      return {
        lang: fieldPair.lang,
        value: fieldPair[type]
      };
    }
  }

  // Preferred language could not be found above. Use another language and make sure it's indicated.
  // There is also the possibility that this is blank.
  return fieldPairs.length !== 0 && fieldPairs[0] !== null
    ? {
        lang: fieldPairs[0].lang,
        value: fieldPairs[0][type]
      }
    : undefined;
}

/**
 * Used for multilingual fields which contain multiple translations of an item.
 *
 * This function should not be exported, see the titleCell and descriptionCell for exportable
 * versions.
 *
 * @param displayAll If true, display all languages available. Used for revisions to display all the
 *    changes.
 * @param allowSorting Enable local sorting support. Cannot be used for tables with pagination, only
 *    when all the rows are loaded into the table.
 * @param accessorKey To find the value in the DinaForm.
 * @param type Short hand version of what's being accessed (ex. desc)
 * @param className Long hand version of what's being accessed (ex. description) - Type is used
 *    if not provided.
 */
function multilingualFieldCell(
  displayAll: boolean,
  allowSorting: boolean,
  accessorKey: string,
  type: string,
  className?: string,
  id?: string
) {
  if (!className) {
    className = type;
  }

  return displayAll
    ? {
        cell: ({ row: { original } }) => {
          return (
            original.value?.[`${className}s`]?.map(
              (field, index) =>
                field?.[type] && (
                  <div className="pb-2" key={index}>
                    {field?.[type]} {languageBadge(field?.lang)}
                  </div>
                )
            ) ?? null
          );
        },
        accessorKey,
        enableSorting: false,
        id: id
      }
    : {
        cell: ({ row: { original } }) => {
          const preferredPair = getPreferredPair(
            original,
            accessorKey,
            type,
            className ?? type
          );

          if (!preferredPair) {
            return <></>;
          } else {
            return (
              <>
                <span className={`${className} list-inline-item`}>
                  {preferredPair.value}
                </span>
                {languageBadge(preferredPair.lang)}
              </>
            );
          }
        },
        accessorKey,
        id: id,
        enableSorting: allowSorting,
        sortingFn: (rowa: any, rowb: any, _: string): number => {
          // Retrieve both languages in the users preferred language.
          const descA =
            getPreferredPair(
              rowa.original,
              accessorKey,
              type,
              className ?? type
            )?.value ?? "";
          const descB =
            getPreferredPair(
              rowb.original,
              accessorKey,
              type,
              className ?? type
            )?.value ?? "";

          return descA.localeCompare(descB);
        },
        header: () => (
          <FieldHeader name={`multilingual${capitalize(className)}`} />
        )
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

export const descriptionCell = (
  displayAll: boolean,
  allowSorting: boolean,
  accessorKey: string,
  id?: string
) =>
  multilingualFieldCell(
    displayAll,
    allowSorting,
    accessorKey,
    "desc",
    "description",
    id
  );
export const titleCell = (
  displayAll: boolean,
  allowSorting: boolean,
  accessorKey: string
) => multilingualFieldCell(displayAll, allowSorting, accessorKey, "title");
