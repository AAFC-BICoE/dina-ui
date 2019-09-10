import { Form, Formik, FormikActions } from "formik";
import { noop } from "lodash";
import { useContext } from "react";
import {
  ApiClientContext,
  NumberField,
  ResourceSelectField,
  SubmitButton,
  TextField
} from "../..";
import {
  Chain,
  ChainStepTemplate,
  LibraryPrepBatch,
  Product,
  Protocol,
  StepResource
} from "../../../types/seqdb-api";
import { filterBy } from "../../../util/rsql";

interface LibraryPrepBatchFormProps {
  chain: Chain;
  libraryPrepBatch?: LibraryPrepBatch;
  onSuccess?: () => void;
  step: ChainStepTemplate;
}

export function LibraryPrepBatchForm({
  chain,
  libraryPrepBatch,
  onSuccess = noop,
  step
}: LibraryPrepBatchFormProps) {
  const { save } = useContext(ApiClientContext);

  async function onSubmit(submittedValues, formik: FormikActions<any>) {
    if (submittedValues.product) {
      submittedValues.product.type = "product";
    }
    if (submittedValues.protocol) {
      submittedValues.protocol.type = "protocol";
    }

    try {
      const [newLibraryPrepBatch] = await save([
        {
          resource: submittedValues,
          type: "libraryPrepBatch"
        }
      ]);

      // Only add a new stepResource if the LibraryPrepBatch is new.
      if (!submittedValues.id) {
        const newStepResource: StepResource = {
          chain,
          chainStepTemplate: step,
          libraryPrepBatch: newLibraryPrepBatch,
          type: "INPUT",
          value: "LIBRARY_PREP_BATCH"
        };

        await save([
          {
            resource: newStepResource,
            type: "stepResource"
          }
        ]);
      }

      onSuccess();
    } catch (err) {
      alert(err);
    }

    formik.setSubmitting(false);
  }

  return (
    <Formik initialValues={libraryPrepBatch || {}} onSubmit={onSubmit}>
      <Form>
        <div className="row">
          <ResourceSelectField<Product>
            className="col-md-2"
            name="product"
            filter={filterBy(["name"])}
            model="product"
            optionLabel={product => product.name}
          />
          <ResourceSelectField<Protocol>
            className="col-md-2"
            name="protocol"
            filter={filterBy(["name"])}
            model="protocol"
            optionLabel={protocol => protocol.name}
          />
        </div>
        <div className="row">
          <NumberField className="col-md-2" name="totalLibraryYieldNm" />
        </div>
        <div className="row">
          <TextField className="col-md-6" name="yieldNotes" />
        </div>
        <div className="row">
          <TextField className="col-md-6" name="cleanUpNotes" />
          <TextField className="col-md-6" name="notes" />
        </div>
        <SubmitButton />
      </Form>
    </Formik>
  );
}
