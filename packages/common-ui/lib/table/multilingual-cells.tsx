import _ from "lodash";
import { useContext } from "react";
import { FieldHeader } from "../field-header/FieldHeader";
import { intlContext } from "../intl/IntlSupport";

interface MultilingualPair {
  lang: string;
  value: string;
}

/**
 * Picks the pair matching the given locale out of a multilingual field's pairs
 * (e.g. MultilingualTitle.titles, MultilingualDescription.descriptions),
 * falling back to the first non-blank pair. Shared by every multilingual
 * field lookup so there's one place defining which translation wins when the
 * current locale isn't available.
 */
export function getPreferredMultilingualPair<
  T extends { lang?: string | null }
>(
  pairs: T[] | null | undefined,
  valueKey: keyof T,
  locale?: string
): T | undefined {
  const nonBlankPairs = (pairs ?? []).filter((pair) => !!pair[valueKey]);

  return nonBlankPairs.find((pair) => pair.lang === locale) ?? nonBlankPairs[0];
}

function getPreferredPair(
  original: any,
  accessorKey: string,
  type: string,
  className: string
): MultilingualPair | undefined {
  const { locale } = useContext(intlContext);

  // Get the multilingual field data provided.
  const multilingualField: any | null = _.get(original, accessorKey);
  const fieldPairs = multilingualField?.[`${className}s`];

  const preferredPair = getPreferredMultilingualPair<any>(
    fieldPairs,
    type,
    locale
  );

  return preferredPair
    ? { lang: preferredPair.lang, value: preferredPair[type] }
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
          <FieldHeader name={`multilingual${_.capitalize(className)}`} />
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
      {_.capitalize(
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
