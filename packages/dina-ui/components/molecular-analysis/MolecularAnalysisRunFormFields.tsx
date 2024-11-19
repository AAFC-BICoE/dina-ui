import {
  LoadingSpinner,
  ReactTable,
  TextField,
  useDinaFormContext
} from "../../../common-ui/lib";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { GroupSelectField } from "../group-select/GroupSelectField";
import {
  SequencingRunItem,
  useMolecularAnalysisRunView
} from "./useMolecularAnalysisRun";
import { SeqdbMessage } from "packages/dina-ui/intl/seqdb-intl";

export function MolecularAnalysisRunFormFields() {
  const { initialValues } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();
  const { loading, sequencingRunItems, columns } = useMolecularAnalysisRunView({
    molecularAnalysisRunId: initialValues.id
  });
  return loading ? (
    <LoadingSpinner loading={true} />
  ) : (
    <div>
      <div className="row mb-3">
        <TextField
          className="col-md-6 name"
          name="name"
          label={formatMessage("field_molecularAnalysisRunName")}
        />
        <GroupSelectField
          name="group"
          enableStoredDefaultGroup={true}
          className="col-md-6"
        />
      </div>
      <div className="col-12">
        <strong>
          <SeqdbMessage id="molecularAnalysisRunItems" />
        </strong>
        <ReactTable<SequencingRunItem>
          className="-striped mt-2"
          columns={columns}
          data={sequencingRunItems ?? []}
          sort={[{ id: "wellCoordinates", desc: false }]}
        />
      </div>
    </div>
  );
}
