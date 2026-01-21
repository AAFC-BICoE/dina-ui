import Link from "next/link";
import { useIntl } from "react-intl";
import { Table } from "react-bootstrap";
import { getIndexConfig } from "./searchConfig";
import { ElasticsearchHit } from "./useMultiIndexSearch";
import { startCase } from "lodash";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";

export interface SearchResultItemProps {
  hit: ElasticsearchHit;
  showIcon?: boolean;
}

/**
 * Renders highlighted text with HTML em tags
 */
function HighlightedText({ text }: { text: string }) {
  if (!text) return null;

  // Split by <em> tags and render with yellow highlight
  const parts = text.split(/(<em>.*?<\/em>)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("<em>") && part.endsWith("</em>")) {
          const content = part.slice(4, -5); // Remove <em> and </em>
          return (
            <mark
              key={index}
              style={{ backgroundColor: "#ffd", padding: "0 2px" }}
            >
              {content}
            </mark>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

export function SearchResultItem({
  hit,
  showIcon = true
}: SearchResultItemProps) {
  const { formatMessage } = useIntl();
  const { formatMessage: formatDianMessage } = useDinaIntl();
  const source = hit._source;
  const highlight = hit.highlight || {};
  const indexName = hit._index;

  const config = getIndexConfig(indexName);
  if (!config) {
    return null;
  }

  const Icon = config.icon;
  const id = source?.data?.id;
  const attrs = source?.data?.attributes || {};

  const formatAttributeName = (attributeName: string) =>
    formatDianMessage(`field_${attributeName}` as any)?.trim() ||
    formatDianMessage(attributeName as any)?.trim() ||
    startCase(attributeName);

  // Get link text based on entity type
  const getLinkText = () => {
    const linkAttr = config.linkAttribute.replace("data.attributes.", "");
    let text = attrs[linkAttr];

    if (!text && linkAttr === "materialSampleName") {
      text = attrs.dwcOtherCatalogNumbers?.join?.(", ");
    }

    return text || id;
  };

  const linkText = getLinkText();

  // Build attribute display rows from highlight or source
  const attributeRows: JSX.Element[] = [];
  Object.entries(highlight).forEach(([field, values]: [string, any]) => {
    const attributeName = field
      .replace("data.attributes.", "")
      .replace(".keyword", "");
    const highlightedValue = Array.isArray(values) ? values[0] : values;

    attributeRows.push(
      <tr key={field}>
        <td>{formatAttributeName(attributeName)}</td>
        <td>
          <HighlightedText text={highlightedValue} />
        </td>
      </tr>
    );
  });

  return (
    <div className="mb-4 pb-3">
      <div className="d-flex align-items-center gap-3 mb-2">
        {showIcon && Icon && (
          <div
            className="d-flex align-items-center justify-content-center text-muted"
            style={{
              width: "50px",
              height: "50px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              fontSize: "1.5rem"
            }}
          >
            <Icon />
          </div>
        )}
        <Link href={`${config.linkPath}${id}`} className="fs-5">
          {linkText}
        </Link>
      </div>
      {attributeRows.length > 0 && (
        <Table
          size="sm"
          className="mb-0"
          style={{ marginLeft: showIcon ? "62px" : "0" }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              <th
                style={{ width: "40%", fontWeight: "normal", color: "#6c757d" }}
              >
                {formatMessage({ id: "attributeLabel" })}
              </th>
              <th style={{ fontWeight: "normal", color: "#6c757d" }}>
                {formatMessage({ id: "valueLabel" })}
              </th>
            </tr>
          </thead>
          <tbody>{attributeRows}</tbody>
        </Table>
      )}
    </div>
  );
}
