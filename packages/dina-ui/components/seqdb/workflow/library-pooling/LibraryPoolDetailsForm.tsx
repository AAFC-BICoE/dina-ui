import {
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  TextField
} from "common-ui";
import { GroupSelectField } from "packages/dina-ui/components/group-select/GroupSelectField";
import {
  Chain,
  ChainStepTemplate,
  LibraryPool,
  StepResource
} from "../../../../types/seqdb-api";

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
  const onSubmit: DinaFormOnSubmit = async ({
    api: { save },
    submittedValues
  }) => {
    // Save the library pool:
    const [savedLibraryPool] = await save(
      [
        {
          resource: submittedValues,
          type: "library-pool"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    // Only add a new stepResource if the LibraryPool is new.
    if (!submittedValues.id) {
      const newStepResource: StepResource = {
        chain,
        chainStepTemplate: step,
        libraryPool: savedLibraryPool as LibraryPool,
        type: "step-resource",
        value: "LIBRARY_POOL"
      };

      await save(
        [
          {
            resource: newStepResource,
            type: "step-resource"
          }
        ],
        { apiBaseUrl: "/seqdb-api" }
      );
    }

    onSuccess();
  };

  return (
    <div>
      <h2>Library Pool</h2>
      <DinaForm initialValues={libraryPool || {}} onSubmit={onSubmit}>
        <div className="row">
          <GroupSelectField
            name="group"
            className="col-md-2"
            enableStoredDefaultGroup={true}
          />
          <TextField className="col-md-2" name="name" />
          <DateField className="col-md-2" name="dateUsed" />
        </div>
        <div className="row">
          <TextField className="col-md-6" name="notes" multiLines={true} />
        </div>
        <SubmitButton />
      </DinaForm>
    </div>
  );
}
