import {
  dateCell,
  descriptionCell,
  FieldHeader,
  useApiClient,
  QueryPage
} from "common-ui";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";

export default function CollectionLinkedProjectsTable({ id }: { id: string }) {
  const { apiClient } = useApiClient();
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get the material samples in this collection.
      const sampleResponse = await apiClient.axios.post(
        "search-api/search-ws/search",
        {
          _source: { includes: ["data.relationships"] },
          query: {
            bool: {
              must: [{ term: { "data.relationships.collection.data.id": id } }]
            }
          }
        },
        { params: { indexName: "dina_material_sample_index" } }
      );

      // Extract and flatten the project IDs from the samples.
      const extractedIds = [
        ...new Set<string>(
          sampleResponse.data.hits.hits
            .flatMap(
              (hit) =>
                hit._source?.data?.relationships?.projects?.data?.map(
                  (a) => a.id
                ) ?? []
            )
            .filter((id): id is string => typeof id === "string" && !!id)
        )
      ];

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
        <div>Loading projects...</div>
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
