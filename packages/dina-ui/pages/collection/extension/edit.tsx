import { DinaForm } from "../../../../common-ui/lib";
import { DataEntry } from "common-ui/lib/formik-connected/data-entry/DataEntry";

export default function FieldEditPage() {
  const blockOptions = [
    { label: "Block Option 1", value: "BLOCK_OPTION_1" },
    { label: "Block Option 2", value: "BLOCK_OPTION_2" },
    { label: "Block Option 3", value: "BLOCK_OPTION_3" }
  ];
  const unitsOptions = [
    { label: "Unit Option 1", value: "UNIT_OPTION_1" },
    { label: "Unit Option 2", value: "UNIT_OPTION_2" },
    { label: "Unit Option 3", value: "UNIT_OPTION_3" }
  ];
  const typeOptions = [
    { label: "Type Option 1", value: "TYPE_OPTION_1" },
    { label: "Type Option 2", value: "TYPE_OPTION_2" },
    { label: "Type Option 3", value: "TYPE_OPTION_3" }
  ];
  return (
    <DinaForm initialValues={{ blocks: [] }}>
      <DataEntry
        blockOptions={blockOptions}
        unitsOptions={unitsOptions}
        model={"agent-api/person"}
        typeOptions={typeOptions}
      />
      <button type="submit">Submit</button>
    </DinaForm>
  );
}
