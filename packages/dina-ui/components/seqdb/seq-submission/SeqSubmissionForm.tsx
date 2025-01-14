import {
  DinaFormOnSubmit,
  DinaForm,
  ButtonBar,
  BackButton,
  SubmitButton
} from "packages/common-ui/lib";
import { SeqSubmission } from "packages/dina-ui/types/seqdb-api/resources/SeqSubmission";
import { useRouter } from "next/router";
import { SeqSubmissionFields } from "./SeqSubmissionFields";

interface SeqSubmissionFormProps {
  seqSubmission?: SeqSubmission;
}

export function SeqSubmissionForm({ seqSubmission }: SeqSubmissionFormProps) {
  const router = useRouter();
  const initialValues = seqSubmission || {};

  const onSubmit: DinaFormOnSubmit = async ({
    api: { save },
    submittedValues
  }) => {
    const response = await save(
      [
        {
          resource: submittedValues,
          type: "seq-submission"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    const newId = response[0].id;
    await router.push(`/seqdb/seq-submission/view?id=${newId}`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar className="mb-3">
        <div className="col-md-6 col-sm-12 mt-2">
          <BackButton
            entityId={seqSubmission?.id as string}
            entityLink="/seqdb/seq-submission"
          />
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
      </ButtonBar>
      <SeqSubmissionFields />
    </DinaForm>
  );
}
