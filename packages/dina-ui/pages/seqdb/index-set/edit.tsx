import { PersistedResource } from "kitsu";
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
  indexSet?: PersistedResource<IndexSet>;
  onSaved?: (resource: PersistedResource<IndexSet>) => Promise<void>;
  buttonBar?: ReactNode;
  readOnlyOverride?: boolean;
  dinaFormProps?: DinaFormProps<IndexSet>;
}

export default function IndexSetEditPage() {
  const router = useRouter();
  const id = router.query.id?.toString();
  const { formatMessage } = useSeqdbIntl();
  const title = id ? "editIndexSetTitle" : "addIndexSetTitle";
  const resourceQuery = useQuery<IndexSet>(
    {
      path: `seqdb-api/index-set/${id}`,
      include: "contents"
    },
    { disabled: !id, deps: [] }
  );

  async function moveToViewPage(savedResource: PersistedResource<IndexSet>) {
    await router.push(`/seqdb/index-set/view?id=${savedResource.id}`);
  }

  const buttonBar = (
    <ButtonBar>
      <BackButton entityId={id} entityLink="/seqdb/index-set" />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <div className="container">
        <h1 id="wb-cont">
          <SeqdbMessage id={title} />
        </h1>
        {id ? (
          withResponse(resourceQuery, ({ data }) => (
            <IndexSetForm
              indexSet={data}
              onSaved={moveToViewPage}
              buttonBar={buttonBar}
            />
          ))
        ) : (
          <IndexSetForm onSaved={moveToViewPage} />
        )}
      </div>
    </div>
  );
}

export function IndexSetForm({
  indexSet,
  onSaved,
  buttonBar,
  readOnlyOverride
}: IndexSetFormProps) {
  const { username } = useAccount();

  const initialValues = indexSet || {
    createdBy: username,
    type: "index-set"
  };

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<IndexSet & { [key: string]: string }>) {
    const [savedResource] = await save<IndexSet>(
      [
        {
          resource: submittedValues,
          type: "library-pool"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
    await onSaved?.(savedResource);
  }
  return (
    <DinaForm<Partial<IndexSet>>
      onSubmit={onSubmit}
      initialValues={initialValues}
      readOnly={readOnlyOverride}
    >
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
        {readOnly && (
          <div className="row">
            <DateField className="col-md-6" name="createdOn" />
            <TextField className="col-md-6" name="createdBy" />
          </div>
        )}
      </div>
    </>
  );
}
