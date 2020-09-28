import {
  filterBy,
  NumberField,
  ResourceSelectField,
  SelectField,
  SubmitButton,
  TextField
} from "common-ui";
import { Form, Formik } from "formik";
import { Product, Protocol } from "../../../types/seqdb-api";
import { useSeqdbIntl } from "../../../intl/seqdb-intl";

interface PreLibraryPrepFormProps {
  onSubmit: (values: any) => void;
}

export function PreLibraryPrepForm({ onSubmit }: PreLibraryPrepFormProps) {
  const { formatMessage } = useSeqdbIntl();

  const PREP_TYPE_OPTIONS = [
    {
      label: formatMessage("shearingLabel"),
      value: "SHEARING"
    },
    {
      label: formatMessage("sizeSelectionLabel"),
      value: "SIZE_SELECTION"
    }
  ];

  async function onSubmitInternal(values, { setSubmitting }) {
    await onSubmit(values);
    setSubmitting(false);
  }

  return (
    <Formik
      initialValues={{ preLibraryPrepType: "SHEARING" }}
      onSubmit={onSubmitInternal}
    >
      {({ resetForm }) => {
        function onTypeChange(newType?: string) {
          resetForm({ values: { preLibraryPrepType: newType } });
        }

        return (
          <Form
            className="card card-body pre-library-prep-form"
            translate={undefined}
          >
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
              <TextField className="col-12" name="notes" multiLines={true} />
            </div>
            <div>
              <SubmitButton />
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
