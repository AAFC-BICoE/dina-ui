import React from "react";
import { useIntl } from "react-intl";

// Helper to get field or operator label from config
function getFieldLabel(field, config) {
  if (!config) return field;
  const fieldConfig = config.fields?.[field];
  return fieldConfig?.label || field;
}

function getOperatorLabel(operator, config) {
  if (!config) return operator;
  const opConfig = config.operators?.[operator];
  return opConfig?.label || operator;
}

// Render node recursively
function renderImmutableTree(node, config, formatMessage) {
  if (!node) return null;
  const type = node.get("type");
  const properties = node.get("properties")?.toJS?.() ?? node.get("properties");
  const children1 = node.get("children1");

  if (type === "group" || type === "rule_group") {
    const conjunction = properties?.conjunction || "AND";
    const childItems = children1 ? Array.from(children1.entries()) : [];
    return (
      <li>
        <span>
            (<em>{conjunction.toUpperCase()}</em>)
        </span>
        {childItems.length > 0 && (
          <ul style={{ marginLeft: 24 }}>
            {childItems.map(([id, childNode]) => (
              <React.Fragment key={id}>
                {renderImmutableTree(childNode, config, formatMessage)}
              </React.Fragment>
            ))}
          </ul>
        )}
      </li>
    );
  }

  if (type === "rule") {
    const field = properties?.field;
    const operator = properties?.operator;
    // Handle value as array or object according to QueryBuilder
    let value = properties?.value;
    if (Array.isArray(value)) {
      value = value.map(v => (typeof v === "object" && v?.value !== undefined ? v.value : String(v))).join(", ");
    } else if (typeof value === "object" && value?.value !== undefined) {
      value = value.value;
    }
    // Optional prettified field and operator
    const fieldLabel = getFieldLabel(field, config);
    const operatorLabel = getOperatorLabel(operator, config);
    if (fieldLabel && operatorLabel && value !== undefined) {
      return (
        <li>
          <span>
            {formatMessage({ id: `field_${fieldLabel}` })} {operatorLabel} {value}
          </span>
        </li>
      );
    } else {
      return
    }
  }
  return null;
}

export default function QueryViewer({ tree, config }) {
  const { formatMessage } = useIntl();
  if (!tree) return <div>No tree to display.</div>;
  return (
    <div>
      <h4>Query Tree</h4>
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {renderImmutableTree(tree, config, formatMessage)}
      </ul>
    </div>
  );
}