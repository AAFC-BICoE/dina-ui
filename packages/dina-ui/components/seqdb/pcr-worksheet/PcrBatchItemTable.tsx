import {
  filterBy,
  LoadingSpinner,
  useApiClient,
  useQuery,
  withResponse
} from "packages/common-ui/lib";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { PcrBatchItem } from "packages/dina-ui/types/seqdb-api";

export function PcrBatchItemTable({ pcrBatchId }: { pcrBatchId: string }) {
  const { apiClient } = useApiClient();

  const query = useQuery<PcrBatchItem[]>(
    {
      path: `/seqdb-api/pcr-batch-item`,
      include: "materialSample",
      filter: filterBy([], {
        extraFilters: [
          {
            selector: "pcrBatch.uuid",
            comparison: "==",
            arguments: pcrBatchId
          }
        ]
      })("")
    },
    {
      onSuccess: async ({ data }) => {
        for (const item of data) {
          if (item && item.materialSample && item.materialSample.id) {
            const { data: materialSample } =
              await apiClient.get<MaterialSample>(
                `collection-api/material-sample/${item.materialSample.id}`,
                {}
              );
            (item.materialSample as MaterialSample).materialSampleName =
              materialSample?.materialSampleName;
          }
        }
      }
    }
  );

  if (query.loading) {
    return <LoadingSpinner loading={true} />;
  }

  return withResponse<PcrBatchItem[]>(query, (response) => (
    <table className="table table-striped table-bordered">
      <thead>
        <tr>
          <th>Well Location</th>
          <th>PCR Tube Number</th>
          <th>Sample Name</th>
          <th>Sample Version</th>
          <th>Specimen Identifier</th>
          <th>Genus</th>
          <th>Species</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        {response.data.map((item) => (
          <tr key={item.id}>
            <td>
              {item.wellColumn}
              {item.wellRow}
            </td>
            <td>{item.cellNumber}</td>
            <td>
              {(item.materialSample as MaterialSample)?.materialSampleName}
            </td>
            <td>Where is version?</td>
            <td>where is Specimen ID?</td>
            <td>Where is Genus</td>
            <td>Where is Species</td>
            <td>{item.result}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ));
}
