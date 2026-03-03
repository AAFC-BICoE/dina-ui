import {
  dateCell,
  descriptionCell,
  FieldHeader,
  useApiClient,
  QueryPage
} from "common-ui";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";

/**
 * This component displays a table of projects that are linked to a collection through material samples.
 * It first queries for material samples in the collection, then extracts the project IDs from those samples,
 * and finally displays the projects in a table.
 * @param id
 */
export default function CollectionLinkedProjectsTable({ id }: { id: string }) {
  const { apiClient } = useApiClient();

  const fetchData = async () => {
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
    setProjectIds([
      ...new Set<string>(
        sampleResponse.data.hits.hits
          .flatMap(
            (hit) =>
              hit._source?.data?.relationships?.projects?.data?.map(
                (a) => a.id
              ) ?? []
          )
          .filter((id) => !!id)
      )
    ]);
  };

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

  const [projectIds, setProjectIds] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  return (
    <div>
      <div>
        <strong>
          <DinaMessage id="collectionLinkedProjectTableTitle" />
        </strong>
      </div>
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
    </div>
  );
}
