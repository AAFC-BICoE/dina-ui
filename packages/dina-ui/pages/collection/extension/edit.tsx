import { Nav } from "packages/dina-ui/components";
import {
  DinaForm,
  EditButton,
  FieldSet,
  FormikButton
} from "packages/common-ui/lib";
import { DataBlock } from "../../../components/data-entry/DataBlock";
import Button from "react-bootstrap/Button";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { useState } from "react";

export default function FieldEditPage() {
  const { formatMessage } = useDinaIntl();
  const [categories, setCategories] = useState<any>([]);
  const options = [
    { label: "Image", value: "IMAGE" },
    { label: "Moving Image", value: "MOVING_IMAGE" },
    { label: "Sound", value: "SOUND" },
    { label: "Text", value: "TEXT" },
    { label: "Dataset", value: "DATASET" },
    { label: "Undetermined", value: "UNDETERMINED" }
  ];
  return (
    <div>
      <FieldSet
        legend={<DinaMessage id="dataEntryLabel" />}
        wrapLegend={legendWrapper()}
      >
        <DinaForm initialValues={{ steps: [""], select: {} }}>
          <DataBlock
            index={categories.length}
            options={options}
            // mocked based on <ResourceSelectField<Person>
            model={"agent-api/person"}
          />
        </DinaForm>
      </FieldSet>
    </div>
  );

  function legendWrapper(): ((legend: JSX.Element) => JSX.Element) | undefined {
    return (legend) => {
      return (
        <div className="d-flex align-items-center justify-content-between">
          {legend}
          <Button>Add</Button>
        </div>
      );
    };
  }
}
