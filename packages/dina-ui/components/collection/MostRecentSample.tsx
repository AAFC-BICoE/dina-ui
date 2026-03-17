import { useEffect, useState } from "react";
import { useApiClient } from "common-ui";
import Link from "next/link";
import { DinaMessage } from "../../intl/dina-ui-intl";

interface LatestSampleProps {
  query?: any;
}

export default function LatestSample({ query }: LatestSampleProps) {
  const { apiClient } = useApiClient();
  const [latestSample, setLatestSample] = useState<any>(null);

  // Fetch latest sample by query
  async function fetchLatestSample() {
    try {
      const response = await apiClient.axios.post(
        "search-api/search-ws/search",
        {
          size: 1, // Only fetch one sample
          query,
          sort: [{ "data.attributes.createdOn": { order: "desc" } }]
        },
        { params: { indexName: "dina_material_sample_index" } }
      );

      // Assume hits/hits structure from ES
      const hits = response.data?.hits?.hits ?? [];
      setLatestSample(hits.length > 0 ? hits[0]?._source?.data?.id : null);
    } catch (error: any) {
      console.error("Error fetching latest sample:", error);
      setLatestSample(null);
    }
  }

  useEffect(() => {
    fetchLatestSample();
  }, [query, apiClient]);

  if (!latestSample) return null;

  return (
    <div>
      <Link href={`/collection/material-sample/view?id=${latestSample}`}>
        <button className="btn btn-info">
          <DinaMessage id="latestSampleTitle" />
        </button>
      </Link>
    </div>
  );
}
