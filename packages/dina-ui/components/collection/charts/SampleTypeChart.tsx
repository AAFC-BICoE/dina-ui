import { useEffect, useState } from "react";
import { useApiClient, Tooltip } from "common-ui";
import ReactECharts from "echarts-for-react";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { Card } from "react-bootstrap";
import { Utils } from "@react-awesome-query-builder/ui";
import _ from "lodash";

interface SampleTypeChart {
  /**
   * The query object from the parent component, used as the base query for fetching data for the chart. This allows the chart to reflect any filters applied in the parent component. The component will add additional filters based on the selected date range preset to this input query when fetching data.
   */
  query?: any;
  /**
   * Whether to add a filter to the parent query when clicking on a bar in the chart. If true, clicking a bar will add a filter for the corresponding date value to the query builder tree in the parent component. This requires passing down the queryBuilderTree and setQueryBuilderTree props as well.
   */
  addFilter?: boolean;
  /**
   * queryBuilderTree state setter from the parent component, needed to add filter on bar click
   */
  setQueryBuilderTree?: any;
  /**
   * queryBuilderTree state value from the parent component, needed to add filter on bar click
   */
  queryBuilderTree?: any;

  /**
   * submittedQueryBuilderTree state value from the parent component, needed to add filter on bar click
   */
  setSubmittedQueryBuilderTree?: any;
}

/**
 * SampleTypeChart component.
 *
 * Renders a chart displaying sample types based on the provided query.
 *
 * @param {Object} props - Component props.
 * @param {any} props.inputQuery - The query object from the parent component, used as the base query for fetching data for the chart. This allows the chart to reflect any filters applied in the parent component. The component will add additional filters based on the selected date range preset to this input query when fetching data.
 * @param {Function} props.addFilter - Whether to add a filter to the parent query when clicking on a bar in the chart. If true, clicking a bar will add a filter for the corresponding date value to the query builder tree in the parent component. This requires passing down the queryBuilderTree and setQueryBuilderTree props as well.
 * @param {Function} props.setQueryBuilderTree - queryBuilderTree state setter from the parent component, needed to add filter on bar click
 * @param {any} props.queryBuilderTree - queryBuilderTree state value from the parent component, needed to add filter on bar click
 * @param {Function} props.setSubmittedQueryBuilderTree - submittedQueryBuilderTree state setter from the parent component, needed to add filter on bar click
 *
 * @returns {JSX.Element} The rendered chart component.
 */
export default function SampleTypeChart({
  query,
  setQueryBuilderTree,
  queryBuilderTree,
  addFilter,
  setSubmittedQueryBuilderTree
}: SampleTypeChart) {
  const { apiClient } = useApiClient();

  // Helper function to get aggregation key format
  const getAggregationKey = (aggName: string, response: any): string => {
    if (response.aggregations[aggName]) {
      return aggName;
    }
    if (response.aggregations[`sterms#${aggName}`]) {
      return `sterms#${aggName}`;
    }

    for (const key of Object.keys(response.aggregations)) {
      if (key.endsWith(aggName)) {
        return key;
      }
    }

    return aggName;
  };

  const addClickToQuery = (params: { name: string }) => {
    if (!queryBuilderTree || !setQueryBuilderTree) return;

    const jsonTree = _.cloneDeep(Utils.getTree(queryBuilderTree));

    // If the clicked bar is "NO_TYPE", we want to filter for documents where materialSampleType is empty. Otherwise, we filter for the specific materialSampleType.
    const newRule =
      params.name === "NO_TYPE"
        ? {
            id: Utils.uuid(),
            type: "rule",
            properties: {
              field: "data.attributes.materialSampleType",
              operator: "empty",
              value: [],
              valueSrc: [],
              valueType: [],
              valueError: [],
              fieldError: undefined,
              fieldSrc: "field"
            }
          }
        : {
            id: Utils.uuid(),
            type: "rule",
            properties: {
              field: "data.attributes.materialSampleType",
              operator: "equals",
              value: [params.name],
              valueSrc: [],
              valueType: [],
              valueError: [],
              fieldError: undefined,
              fieldSrc: "field"
            }
          };

    if (!jsonTree.children1) {
      jsonTree.children1 = [newRule as any];
    } else {
      jsonTree.children1 = [...jsonTree.children1, newRule] as any;
    }

    const newTree = Utils.loadTree(jsonTree);

    setQueryBuilderTree(newTree);

    setSubmittedQueryBuilderTree(newTree);
  };
  const dataMap: Record<string, number> = {
    WHOLE_ORGANISM: 0,
    MIXED_ORGANISMS: 0,
    CULTURE_STRAIN: 0,
    ORGANISM_PART: 0,
    MOLECULAR_SAMPLE: 0,
    NO_TYPE: 0
  };

  async function fetchData() {
    try {
      const response = await apiClient.axios.post(
        "search-api/search-ws/search",
        {
          size: 0,
          query,
          aggs: {
            by_sample_type: {
              terms: {
                field: "data.attributes.materialSampleType.keyword",
                size: 10,
                missing: "NO_TYPE",
                order: { _count: "desc" }
              }
            }
          }
        },
        { params: { indexName: "dina_material_sample_index" } }
      );

      if (response.data.aggregations) {
        const aggKey = getAggregationKey("by_sample_type", response.data);
        const buckets = response.data.aggregations[aggKey]?.buckets ?? [];
        if (buckets.length != 0) {
          buckets.map((b) => (dataMap[b.key] = b.doc_count));

          setChartData(
            Object.entries(dataMap).map(([name, value]) => ({ name, value }))
          );
        } else {
          // don't add values with 0 entries if bucket is empty
          setChartData([]);
        }
      }
    } catch (error: any) {
      console.error("Error fetching sample type data:", error);
      setChartData([]);
    }
  }

  const [chartData, setChartData] = useState<{ name: string; value: number }[]>(
    []
  );

  useEffect(() => {
    fetchData();
  }, [query, apiClient]);

  const options = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      }
    },
    xAxis: {
      type: "category",
      data: chartData.map((d) => d.name),
      axisLabel: {
        interval: 0,
        rotate: 25,
        overflow: "breakAll",
        hideOverlap: false
      }
    },
    yAxis: {
      type: "value",
      minInterval: 1
    },
    series: [
      {
        name: "Sample Count",
        type: "bar",
        data: chartData.map((d) => d.value),
        itemStyle: {
          color: "#5470c6"
        }
      }
    ]
  };

  return (
    <div>
      <strong>
        <DinaMessage id="sampleTypeChartTitle" />
        {addFilter && <Tooltip id="addFilterTooltip" />}
      </strong>
      <Card>
        {chartData.length > 0 ? (
          <ReactECharts
            option={options}
            style={{ height: "400px", width: "100%" }}
            onEvents={addFilter ? { click: addClickToQuery } : {}}
          />
        ) : (
          <div
            style={{
              height: "400px",
              justifyContent: "center",
              alignItems: "center",
              display: "flex",
              color: "#999",
              fontSize: 18
            }}
          >
            <DinaMessage id="noData" />
          </div>
        )}
      </Card>
    </div>
  );
}
