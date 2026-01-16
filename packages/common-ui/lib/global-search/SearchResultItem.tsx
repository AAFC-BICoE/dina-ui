import Link from "next/link";
import { Card } from "react-bootstrap";
import { getIndexConfig } from "./searchConfig";
import { ElasticsearchHit } from "./useMultiIndexSearch";

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
        <td className="text-muted" style={{ width: "150px" }}>
          {attributeName}
        </td>
        <td>
          <HighlightedText text={highlightedValue} />
        </td>
      </tr>
    );
  });

  return (
    <Card className="mb-3">
      <Card.Body>
        <div className="d-flex align-items-start gap-3">
          {showIcon && Icon && (
            <div
              className="text-muted"
              style={{ fontSize: "2rem", marginTop: "0.25rem" }}
            >
              <Icon />
            </div>
          )}
          <div className="flex-grow-1">
            <Card.Title>
              <Link href={`${config.linkPath}${id}`}>
                <strong>{linkText}</strong>
              </Link>
            </Card.Title>
            {attributeRows.length > 0 && (
              <table className="table table-sm table-borderless mb-0">
                <tbody>{attributeRows}</tbody>
              </table>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
