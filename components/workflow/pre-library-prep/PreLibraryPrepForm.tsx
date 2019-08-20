import { connect } from "formik";
import { Product, Protocol } from "types/seqdb-api";
import {
  NumberField,
  ResourceSelectField,
  SelectField,
  SubmitButton,
  TextField
} from "../..";
import { filterBy } from "../../../util/rsql";

export const PreLibraryPrepForm = connect<{}, any>(
  ({ formik: { values, resetForm } }) => {
    function onTypeChange(newType?: string) {
      const checkedIds = values.checkedIds;
      resetForm({ checkedIds, preLibraryPrepType: newType });
    }

    return (
      <div className="card card-body">
        <div className="row">
          <SelectField
            className="col-6"
            onChange={onTypeChange}
            options={PREP_TYPE_OPTIONS}
            name="preLibraryPrepType"
          />
          <NumberField className="col-6" name="inputAmount" />
          <NumberField className="col-6" name="concentration" />
          <NumberField className="col-6" name="targetDpSize" />
          <NumberField className="col-6" name="averageFragmentSize" />
          <TextField className="col-6" name="quality" />
          <ResourceSelectField<Protocol>
            className="col-6"
            filter={filterBy(["name"])}
            name="protocol"
            model="protocol"
            optionLabel={protocol => protocol.name}
          />
          <ResourceSelectField<Product>
            className="col-6"
            filter={filterBy(["name"])}
            label="Kit"
            model="product"
            name="product"
            optionLabel={kit => kit.name}
          />
          <TextField className="col-12" name="notes" />
        </div>
        <div>
          <SubmitButton />
        </div>
      </div>
    );
  }
);

const PREP_TYPE_OPTIONS = [
  {
    label: "Shearing",
    value: "SHEARING"
  },
  {
    label: "Size Selection",
    value: "SIZE_SELECTION"
  }
];
