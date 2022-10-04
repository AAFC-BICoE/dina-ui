import { Config, ImmutableTree } from "react-awesome-query-builder";

/**
 * This function is recursive and will go through each level to generate the query.
 * @param tree ImmutableTree from the QueryBuilder to transform to elastic search.
 * @param config The Query Builder configuration.
 * @returns The root elastic search query.
 */
export function elasticSearchFormatExport(tree: ImmutableTree, config: Config) {
  if (!tree) return undefined;
  const type = tree.get("type");
  const properties = tree.get("properties") || new Map();

  if (type === "rule" && properties.get("field")) {
    const operator = properties.get("operator");
    const field = properties.get("field");
    const value = properties.get("value").toJS();

    return buildEsRule(field, value, operator, config);
  }

  if (type === "group" || type === "rule_group") {
    let conjunction = properties.get("conjunction");
    if (!conjunction) conjunction = "AND";

    const children = tree.get("children1");
    return buildEsGroup(
      children,
      conjunction,
      elasticSearchFormatExport,
      config
    );
  }
}

/**
 * All of the heavy lifting for the query generation is handled by the elasticSearchFormatValue
 * which uses the transform to DSL functions. Checkout the widget configuration for each type.
 * @param fieldName Query row field name
 * @param value Query row value
 * @param operator Operator being used (equals, exact match, etc...)
 * @param config The entire query builder configuration.
 * @returns Elastic Search Query for the one row on the Query Builder.
 */
function buildEsRule(
  fieldName: string,
  value: string,
  operator: string,
  config: Config
) {
  const widgetName = config.fields[fieldName].type;
  const widgetConfig = config.widgets[widgetName];
  if (!widgetConfig) return undefined; // Unable to find the widget.

  const { elasticSearchFormatValue } = widgetConfig as any;

  // Use the custom logic by default.
  const parameters = elasticSearchFormatValue(
    undefined,
    value,
    operator,
    fieldName,
    config
  );

  return { ...parameters };
}

/**
 * Handle the "AND" / "OR" logic at this level. A group can contain multiple rules.
 * @param children Contents of the group
 * @param conjunction "AND"/"OR" conjunctions
 * @param recursiveFunction What to use to build the contents of the group.
 * @param config Query Builder configuration.
 * @returns Elastic search group of queries.
 */
function buildEsGroup(
  children,
  conjunction,
  recursiveFunction,
  config: Config
) {
  // If there is nothing in the group, then don't add it to the query.
  if (!children || !children.size) return undefined;

  const childrenArray = children.valueSeq().toArray();

  // The conjunction determines if it's "MUST" or "SHOULD"
  const conjunctionTerm = conjunction === "AND" ? "must" : "should";

  // Go through each of the children and generate the elastic search query for each item.
  const result = childrenArray
    .map((c) => recursiveFunction(c, config))
    .filter((v) => v !== undefined);

  // If no results, do not add this group to the query.
  if (!result.length) return undefined;

  const resultFlat = result.flat(Infinity);

  return {
    bool: {
      [conjunctionTerm]: resultFlat
    }
  };
}
