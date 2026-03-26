import {
  dateCell,
  descriptionCell,
  FieldHeader,
  useApiClient,
  QueryPage,
  LoadingSpinner
} from "common-ui";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { DinaMessage } from "../../../../../packages/dina-ui/intl/dina-ui-intl";

export function CollectionLinkedProjectsTable({ id }: { id: string }) {
  const { apiClient } = useApiClient();
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use an aggregation to get all unique project IDs linked to the material samples
      const sampleResponse = await apiClient.axios.post(
        "search-api/search-ws/search",
        {
          size: 0,
          query: {
            bool: {
              must: [{ term: { "data.relationships.collection.data.id": id } }]
            }
          },
          aggs: {
            unique_projects: {
              terms: {
                field: "data.relationships.projects.data.id",
                size: 10000
              }
            }
          }
        },
        { params: { indexName: "dina_material_sample_index" } }
      );

      // Extract the project IDs from the aggregation buckets
      const buckets =
        sampleResponse.data.aggregations?.["sterms#unique_projects"]?.buckets ||
        [];

      const extractedIds = buckets
        .map((bucket: any) => bucket.key)
        .filter((key: string) => !!key);

      setProjectIds(extractedIds);
    } catch (err) {
      setError(
        "Failed to load linked projects: " + (err as any)?.message ||
          "Unknown error"
      );
      setProjectIds([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, id]);

  useEffect(() => {
    let cancelled = false;

    fetchData().then(() => {
      if (cancelled) {
        // Reset state if component unmounted during fetch
        setProjectIds([]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  const PROJECT_TABLE_COLUMNS = [
    {
      id: "name",
      cell: ({ row: { original } }) => {
        return (
          <Link href={`/collection/project/view?id=${original.id}`}>
            {original.data.attributes.name || original.id}
          </Link>
        );
      },
      header: () => <FieldHeader name="name" />,
      accessorKey: "data.attributes.name"
    },
    {
      id: "status",
      header: () => <FieldHeader name="status" />,
      accessorKey: "data.attributes.status"
    },
    {
      id: "group",
      header: () => <FieldHeader name="group" />,
      accessorKey: "data.attributes.group"
    },
    descriptionCell(
      false,
      false,
      "data.attributes.multilingualDescription",
      "multilingualDescription"
    ),
    dateCell("startDate", "data.attributes.startDate"),
    dateCell("endDate", "data.attributes.endDate"),
    {
      id: "createdBy",
      header: () => <FieldHeader name="createdBy" />,
      accessorKey: "data.attributes.createdBy"
    },
    dateCell("createdOn", "data.attributes.createdOn")
  ];

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <div>
        <strong>
          <DinaMessage id="collectionLinkedProjectTableTitle" />
        </strong>
      </div>
      {isLoading ? (
        <LoadingSpinner loading={isLoading} />
      ) : (
        <QueryPage
          columns={PROJECT_TABLE_COLUMNS}
          indexName="dina_project_index"
          uniqueName="relatedProjects"
          customViewElasticSearchQuery={{
            query: {
              terms: { "data.id": projectIds }
            }
          }}
          viewMode={true}
          customViewFilterGroups={false}
          customViewFields={[
            {
              fieldName: "data.id",
              type: "uuid"
            }
          ]}
          enableColumnSelector={false}
        />
      )}
    </div>
  );
}
