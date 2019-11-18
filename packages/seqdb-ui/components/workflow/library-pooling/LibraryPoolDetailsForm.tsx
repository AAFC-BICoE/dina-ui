import {
  ApiClientContext,
  DateField,
  ErrorViewer,
  safeSubmit,
  SubmitButton,
  TextField
} from "common-ui";
import { Form, Formik } from "formik";
import { useContext } from "react";
import {
  Chain,
  ChainStepTemplate,
  LibraryPool,
  StepResource
} from "../../../types/seqdb-api";

export interface LibraryPoolDetailsFormProps {
  chain: Chain;
  libraryPool?: LibraryPool;
  onSuccess: () => void;
  step: ChainStepTemplate;
}

export function LibraryPoolDetailsForm({
  chain,
  libraryPool,
  onSuccess,
  step
}: LibraryPoolDetailsFormProps) {
  const { save } = useContext(ApiClientContext);

  const onSubmit = safeSubmit(async submittedValues => {
    // Save the library pool:
    const [savedLibraryPool] = await save([
      {
        resource: submittedValues,
        type: "libraryPool"
      }
    ]);

    // Only add a new stepResource if the LibraryPool is new.
    if (!submittedValues.id) {
      const newStepResource: StepResource = {
        chain,
        chainStepTemplate: step,
        libraryPool: savedLibraryPool as LibraryPool,
        type: "INPUT",
        value: "LIBRARY_POOL"
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
    <Formik initialValues={libraryPool || {}} onSubmit={onSubmit}>
      <Form>
        <h2>Library Pool</h2>
        <ErrorViewer />
        <div className="row">
          <TextField className="col-md-2" name="name" />
          <DateField className="col-md-2" name="dateUsed" />
        </div>
        <SubmitButton />
      </Form>
    </Formik>
  );
}
