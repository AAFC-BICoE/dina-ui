import { useRouter } from "next/router";
import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormProps,
  DinaFormSubmitParams,
  SubmitButton,
  TextField,
  useAccount,
  useDinaFormContext,
  useQuery,
  withResponse
} from "packages/common-ui";
import { GroupSelectField, Head, Nav } from "packages/dina-ui/components";
import { SeqdbMessage, useSeqdbIntl } from "packages/dina-ui/intl/seqdb-intl";
import { IndexSet } from "packages/dina-ui/types/seqdb-api";
import { ReactNode } from "react";

export interface IndexSetFormProps {
  dinaFormProps: DinaFormProps<IndexSet>;
  buttonBar?: ReactNode;
}

export default function IndexSetEditPage() {
  const router = useRouter();
  const id = router.query.id?.toString();
  const { formatMessage } = useSeqdbIntl();
  const { username } = useAccount();

  const title = id ? "editIndexSetTitle" : "addIndexSetTitle";
  const resourceQuery = useQuery<IndexSet>(
    {
      path: `seqdb-api/index-set/${id}`,
      include: "contents"
    },
    { disabled: !id, deps: [] }
  );

  const buttonBar = (
    <ButtonBar>
      <BackButton entityId={id} entityLink="/seqdb/index-set" />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<IndexSet & { [key: string]: string }>) {
    const [savedResource] = await save<IndexSet>(
      [
        {
          resource: submittedValues,
          type: "index-set"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
    await router.push(`/seqdb/index-set/view?id=${savedResource.id}`);
  }

  return (
    <main className="container-fluid">
      <Head title={formatMessage(title)} />
      <Nav />

      <h1 id="wb-cont">
        <SeqdbMessage id={title} />
      </h1>
      {id ? (
        withResponse(resourceQuery, ({ data }) => {
          return (
            <IndexSetForm
              dinaFormProps={{ initialValues: data, onSubmit }}
              buttonBar={buttonBar}
            />
          );
        })
      ) : (
        <IndexSetForm
          dinaFormProps={{
            initialValues: {
              createdBy: username,
              type: "index-set"
            } as IndexSet,
            onSubmit
          }}
          buttonBar={buttonBar}
        />
      )}
    </main>
  );
}

export function IndexSetForm({ dinaFormProps, buttonBar }: IndexSetFormProps) {
  return (
    <DinaForm<Partial<IndexSet>> {...dinaFormProps}>
      {buttonBar}
      <IndexSetFields />
    </DinaForm>
  );
}

/** Re-usable field layout between edit and view pages. */
function IndexSetFields() {
  const { readOnly } = useDinaFormContext();

  return (
    <>
      <div className="row">
        <TextField className="col-md-6" name="name" />
        {!readOnly && (
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-6"
          />
        )}
      </div>
      <div className="row">
        <TextField className="col-md-6" name="forwardAdapter" />
        <TextField className="col-md-6" name="reverseAdapter" />
      </div>
      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" name="createdOn" />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </>
  );
}
