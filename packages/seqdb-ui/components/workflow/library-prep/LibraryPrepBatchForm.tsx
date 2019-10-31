import {
  ApiClientContext,
  ErrorViewer,
  filterBy,
  NumberField,
  ResourceSelectField,
  safeSubmit,
  SubmitButton,
  TextField
} from "common-ui";
import { Form, Formik } from "formik";
import { useContext } from "react";
import {
  Chain,
  ChainStepTemplate,
  ContainerType,
  IndexSet,
  LibraryPrepBatch,
  PcrProfile,
  Product,
  Protocol,
  StepResource
} from "../../../types/seqdb-api";

interface LibraryPrepBatchFormProps {
  chain: Chain;
  libraryPrepBatch?: LibraryPrepBatch;
  onSuccess: () => void;
  step: ChainStepTemplate;
}

export function LibraryPrepBatchForm({
  chain,
  libraryPrepBatch,
  onSuccess,
  step
}: LibraryPrepBatchFormProps) {
  const { save } = useContext(ApiClientContext);

  const onSubmit = safeSubmit(async submittedValues => {
    if (submittedValues.product) {
      submittedValues.product.type = "product";
    }
    if (submittedValues.protocol) {
      submittedValues.protocol.type = "protocol";
    }

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
        libraryPrepBatch: newLibraryPrepBatch as LibraryPrepBatch,
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
  });

  return (
    <Formik initialValues={libraryPrepBatch || {}} onSubmit={onSubmit}>
      <Form>
        <ErrorViewer />
        <div className="row">
          <TextField
            className="col-md-2"
            label="Library Prep Batch Name"
            name="name"
          />
        </div>
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
          <ResourceSelectField<ContainerType>
            className="col-md-2"
            name="containerType"
            filter={filterBy(["name"])}
            model="containerType"
            optionLabel={ct => ct.name}
          />
          <ResourceSelectField<PcrProfile>
            className="col-md-2"
            name="thermocyclerProfile"
            filter={filterBy(["name"])}
            model="thermocyclerprofile"
            optionLabel={profile => profile.name}
          />
          <ResourceSelectField<IndexSet>
            className="col-md-2"
            name="indexSet"
            filter={filterBy(["name"])}
            model="indexSet"
            optionLabel={set => set.name}
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
