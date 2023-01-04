import { DinaForm } from "../../../../common-ui/lib";
import { DataEntry } from "common-ui/lib/formik-connected/data-entry/DataEntry";

export default function FieldEditPage() {
  const options = [
    { label: "Image", value: "IMAGE" },
    { label: "Moving Image", value: "MOVING_IMAGE" },
    { label: "Sound", value: "SOUND" },
    { label: "Text", value: "TEXT" },
    { label: "Dataset", value: "DATASET" },
    { label: "Undetermined", value: "UNDETERMINED" }
  ];
  const unitsOptions = [{ label: "ul/rxn", value: "ul" }];
  return (
    <DinaForm
      initialValues={{ blocks: [{}] }}
      // onSubmit={async (values) => {
      //   console.log(values);
      // }}
    >
      <DataEntry
        options={options}
        unitsOptions={unitsOptions}
        model={"agent-api/person"}
      />
      <button type="submit">Submit</button>
    </DinaForm>
  );
}
