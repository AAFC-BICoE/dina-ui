import { useRef, useEffect } from "react";
import * as echarts from "echarts";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { DINAUI_MESSAGES_ENGLISH } from "../../../intl/dina-ui-en";

export interface EsBarChartProps {
  data: { name: string; value: number }[];
  titleId: keyof typeof DINAUI_MESSAGES_ENGLISH;
  chartOptions?: echarts.EChartsOption;
}

/**
 * Generic ECharts bar chart component that can be reused for different queries and indices
 *  */
export default function EBarChart({
  data,
  titleId,
  chartOptions
}: EsBarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Init and cleanup chart once
  useEffect(() => {
    chartInstance.current = echarts.init(chartRef.current!);
    return () => chartInstance.current?.dispose();
  }, []);

  // Render when data changes
  useEffect(() => {
    if (!data.length || !chartInstance.current) return;
    chartInstance.current.setOption(
      chartOptions ?? {
        tooltip: { trigger: "axis" },
        grid: {
          bottom: "10%",
          containLabel: true
        },
        xAxis: {
          type: "category",
          data: data.map((d) => d.name),
          axisLabel: {
            interval: 0,
            rotate: 45,
            overflow: "break",
            width: 80,
            hideOverlap: false
          }
        },
        yAxis: {
          type: "value",
          minInterval: 1
        },
        series: [
          {
            type: "bar",
            data: data.map((d) => d.value)
          }
        ]
      }
    );
  }, [data]);

  return (
    <div>
      <strong>
        <DinaMessage id={titleId} />
      </strong>
      <div ref={chartRef} style={{ height: "400px", width: "100%" }} />
    </div>
  );
}
