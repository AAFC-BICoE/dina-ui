import { Nav } from "packages/dina-ui/components";
import { EditButton, FieldSet, FormikButton } from "packages/common-ui/lib";
import { DataBlock } from "../../../components/data-entry/DataBlock";
import Button from "react-bootstrap/Button";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { useState } from "react";

export default function FieldEditPage() {
  const { formatMessage } = useDinaIntl();
  const [categories, setCategories] = useState<any>([]);
  return (
    <div>
      <FieldSet
        legend={<DinaMessage id="dataEntryLabel" />}
        wrapLegend={legendWrapper()}
      >
        <DataBlock index={categories.length} />
      </FieldSet>
    </div>
  );

  function legendWrapper(): ((legend: JSX.Element) => JSX.Element) | undefined {
    return (legend) => {
      return (
        <div className="d-flex align-items-center justify-content-between">
          {legend}
          <Button onClick={() => setCategories(categories.push(DataBlock))}>
            Add
          </Button>
        </div>
      );
    };
  }
}
