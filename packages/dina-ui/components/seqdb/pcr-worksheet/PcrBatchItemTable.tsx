import {
  filterBy,
  LoadingSpinner,
  useApiClient,
  useQuery,
  withResponse
} from "../../../../common-ui/lib";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { MaterialSample } from "../../../../dina-ui/types/collection-api";
import { PcrBatchItem } from "../../../../dina-ui/types/seqdb-api";
import { getScientificNames } from "../../collection/material-sample/organismUtils";

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
            item.materialSample = materialSample;
            // (item.materialSample as MaterialSample).materialSampleName =
            //   materialSample?.materialSampleName;
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
          <th>
            <DinaMessage id="wellLocation" />
          </th>
          <th>
            <DinaMessage id="pcrTubeNumber" />
          </th>
          <th>
            <DinaMessage id="field_sampleName" />
          </th>
          <th>
            <DinaMessage id="specimenIdentifier" />
          </th>
          <th>
            <DinaMessage id="field_scientificNameInput" />
          </th>
          <th>
            <DinaMessage id="result" />
          </th>
        </tr>
      </thead>
      <tbody>
        {response.data.map((item) => {
          const scientificNames = getScientificNames(
            item.materialSample as MaterialSample
          );
          return (
            <tr key={item.id}>
              <td>
                {item.wellColumn}
                {item.wellRow}
              </td>
              <td>{item.cellNumber}</td>
              <td>
                {(item.materialSample as MaterialSample)?.materialSampleName}
              </td>
              <td>where is Specimen ID?</td>
              <td>{scientificNames}</td>
              <td>{item.result}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  ));
}
