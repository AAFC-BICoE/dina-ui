import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormSubmitParams,
  SubmitButton,
  TextField,
  useAccount,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { GroupSelectField, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { LibraryPool2 } from "../../../types/seqdb-api";

export function useLibraryPoolQuery(id?: string, deps?: any[]) {
  return useQuery<LibraryPool2>(
    {
      path: `seqdb-api/library-pool/${id}`,
      include: "contents"
    },
    { disabled: !id, deps }
  );
}
export default function LibraryPoolEditPage() {
  const router = useRouter();
  const { formatMessage } = useSeqdbIntl();

  const id = router.query.id?.toString();

  const resourceQuery = useLibraryPoolQuery(id);

  const title = id ? "editLibraryPoolTitle" : "addLibraryPoolTitle";

  async function moveToViewPage(
    savedResource: PersistedResource<LibraryPool2>
  ) {
    await router.push(`/seqdb/library-pool/view?id=${savedResource.id}`);
  }

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
            <LibraryPoolForm libraryPool={data} onSaved={moveToViewPage} />
          ))
        ) : (
          <LibraryPoolForm onSaved={moveToViewPage} />
        )}
      </div>
    </div>
  );
}

export interface LibraryPoolFormProps {
  libraryPool?: PersistedResource<LibraryPool2>;
  onSaved: (resource: PersistedResource<LibraryPool2>) => Promise<void>;
  buttonBar?: ReactNode;
  readOnlyOverride?: boolean;
}

export function LibraryPoolForm({
  libraryPool,
  onSaved,
  buttonBar = (
    <ButtonBar>
      <BackButton entityId={libraryPool?.id} entityLink="/seqdb/library-pool" />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  ),
  readOnlyOverride
}: LibraryPoolFormProps) {
  const { username } = useAccount();

  const initialValues = libraryPool || {
    createdBy: username,
    type: "library-pool"
  };

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<LibraryPool2 & { [key: string]: string }>) {
    const [savedResource] = await save<LibraryPool2>(
      [
        {
          resource: submittedValues,
          type: "library-pool"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
    await onSaved(savedResource);
  }

  return (
    <DinaForm<Partial<LibraryPool2>>
      onSubmit={onSubmit}
      initialValues={initialValues}
      readOnly={readOnlyOverride}
    >
      {buttonBar}
      <LibraryPoolFormFields />
    </DinaForm>
  );
}

/** Re-usable field layout between edit and view pages. */
function LibraryPoolFormFields() {
  const { readOnly } = useDinaFormContext();

  return (
    <div>
      <div className="row">
        {!readOnly && (
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-12"
          />
        )}
        <TextField className="col-md-6" name="name" />
        {/* <CheckBoxField
          name="isCompleted"
          className="gap-3 col-md-6"
          overridecheckboxProps={{
            style: {
              height: "30px",
              width: "30px"
            }
          }}
        /> */}
        <DateField className="col-md-6" name="dateUsed" />
        <TextField className="col-md-6" name="notes" multiLines={true} />
      </div>
      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" name="createdOn" />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </div>
  );
}
