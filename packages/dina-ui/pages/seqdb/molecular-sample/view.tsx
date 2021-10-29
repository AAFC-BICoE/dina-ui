import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { MolecularSample } from "../../../types/seqdb-api";
import { MolecularSampleFields, useMolecularSample } from "./edit";

export default function MolecularSampleDetailsPage() {
  return (
    <ViewPageLayout<MolecularSample>
      form={props => (
        <DinaForm<MolecularSample> {...props}>
          <MolecularSampleFields />
        </DinaForm>
      )}
      query={id => ({ path: `seqdb-api/molecular-sample/${id}` })}
      customQueryHook={id => useMolecularSample(id)}
      entityLink="/seqdb/molecular-sample"
      type="molecular-sample"
      apiBaseUrl="/seqdb-api"
    />
  );
}
