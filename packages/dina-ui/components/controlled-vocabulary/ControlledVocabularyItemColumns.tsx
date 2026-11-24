import {
  ColumnDefinition,
  dateCell,
  descriptionCell,
  getPreferredMultilingualPair
} from "common-ui";
import Link from "next/link";
import { useState } from "react";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { ControlledVocabularyItem } from "../../types/collection-api/resources/ControlledVocabularyItem";
import { VOCABULARY_ELEMENT_TYPE_OPTIONS } from "../../types/collection-api/resources/VocabularyElementType";
import { groupCell } from "../group-select/GroupFieldView";

/** Item attributes searched by the controlled-vocabulary-item free-text filter. */
export const CV_FILTER_ATTRIBUTES = ["name", "key", "unit", "createdBy"];

/** Accepted values past this count are hidden behind a "Show More" toggle. */
const ACCEPTED_VALUES_LIMIT = 7;

function AcceptedValuesBadges({ values }: { values: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? values : values.slice(0, ACCEPTED_VALUES_LIMIT);

  return (
    <div className="d-flex flex-wrap align-items-center gap-1">
      {shown.map((value, index) => (
        <span key={index} className="badge rounded-pill bg-secondary">
          {value}
        </span>
      ))}
      {values.length > ACCEPTED_VALUES_LIMIT && (
        <button
          type="button"
          className="btn btn-link btn-sm p-0"
          onClick={() => setExpanded(!expanded)}
        >
          <DinaMessage id={expanded ? "showLess" : "showMore"} />
        </button>
      )}
    </div>
  );
}

/** Links the item by its title in the user's language, falling back to its name. */
function NameCell({
  item,
  viewRoute
}: {
  item: ControlledVocabularyItem;
  viewRoute: string;
}) {
  const { locale } = useDinaIntl();
  const title = getPreferredMultilingualPair(
    item.multilingualTitle?.titles,
    "title",
    locale
  )?.title;

  return (
    <Link href={`${viewRoute}?id=${item.id}`}>
      {title || item.name || item.id}
    </Link>
  );
}

export function getControlledVocabularyItemColumns(
  viewRoute: string,
  componentLabel: (component: string) => string
): ColumnDefinition<ControlledVocabularyItem>[] {
  return [
    {
      accessorKey: "name",
      header: () => <DinaMessage id="field_name" />,
      cell: ({ row: { original } }) => (
        <NameCell item={original} viewRoute={viewRoute} />
      )
    },
    {
      accessorKey: "dinaComponent",
      header: () => <DinaMessage id="field_dinaComponent" />,
      cell: ({ row: { original } }) =>
        original.dinaComponent ? componentLabel(original.dinaComponent) : ""
    },
    {
      accessorKey: "vocabularyElementType",
      header: () => <DinaMessage id="field_vocabularyElementType" />,
      cell: ({ row: { original } }) => {
        const option = VOCABULARY_ELEMENT_TYPE_OPTIONS.find(
          ({ value }) => value === original.vocabularyElementType
        );
        return option ? (
          <DinaMessage id={option.labelKey} />
        ) : (
          original.vocabularyElementType ?? ""
        );
      }
    },
    {
      accessorKey: "unit",
      header: () => <DinaMessage id="field_unit" />,
      cell: ({ row: { original } }) => original.unit ?? ""
    },
    {
      accessorKey: "acceptedValues",
      header: () => <DinaMessage id="field_acceptedValues" />,
      cell: ({ row: { original } }) =>
        Array.isArray(original.acceptedValues) ? (
          <AcceptedValuesBadges values={original.acceptedValues} />
        ) : (
          ""
        )
    },
    descriptionCell(false, false, "multilingualDescription"),
    groupCell("group"),
    {
      accessorKey: "createdBy",
      header: () => <DinaMessage id="field_createdBy" />
    },
    dateCell("createdOn")
  ];
}
