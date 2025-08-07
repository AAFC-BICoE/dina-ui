import { useRouter } from "next/router";
import { ReactNode, useRef } from "react";
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
} from "../../../../common-ui";
import {
  Footer,
  GroupSelectField,
  Head,
  Nav,
  NgsIndexField
} from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { IndexSet, NgsIndex, ngsIndexParser } from "../../../types/seqdb-api";

export interface IndexSetFormProps {
  dinaFormProps: DinaFormProps<IndexSet>;
  onRemoveNgsIndex: (ngsIndex: NgsIndex) => void;
  buttonBar?: ReactNode;
}

export default function IndexSetEditPage() {
  const router = useRouter();
  const id = router.query.id?.toString();
  const { formatMessage } = useSeqdbIntl();
  const { username } = useAccount();
  const ngsIndexesToDelete = useRef<NgsIndex[]>([]);

  const title = id ? "editIndexSetTitle" : "addIndexSetTitle";
  const resourceQuery = useQuery<IndexSet>(
    {
      path: `seqdb-api/index-set/${id}`,
      include: "ngsIndexes"
    },
    { disabled: !id, deps: [], parser: ngsIndexParser }
  );

  const buttonBar = (
    <ButtonBar className="mb-3">
      <div className="col-md-6 col-sm-12 mt-2">
        <BackButton entityId={id} entityLink="/seqdb/index-set" />
      </div>
      <div className="col-md-6 col-sm-12 d-flex">
        <SubmitButton className="ms-auto" />
      </div>
    </ButtonBar>
  );

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<IndexSet & { [key: string]: string }>) {
    const ngsIndexes = submittedValues.ngsIndexes;
    delete submittedValues.ngsIndexes;
    const [savedIndexSet] = await save<IndexSet>(
      [
        {
          resource: submittedValues,
          type: "index-set"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
    if (ngsIndexes && ngsIndexes.length > 0) {
      const ngsIndexResources = ngsIndexes?.map((ngsIndex) => {
        ngsIndex.indexSet = savedIndexSet;
        return {
          resource: ngsIndex,
          type: "ngs-index"
        };
      });
      await save<NgsIndex>(ngsIndexResources, { apiBaseUrl: "/seqdb-api" });
    }
    if (ngsIndexesToDelete.current.length > 0) {
      const resourceToDelete = ngsIndexesToDelete.current.map((ngsIndex) => ({
        delete: {
          id: ngsIndex.id as string,
          type: "ngs-index"
        }
      }));
      await save<NgsIndex>(resourceToDelete, { apiBaseUrl: "/seqdb-api" });
    }
    await router.push(`/seqdb/index-set/view?id=${savedIndexSet.id}`);
  }

  function onRemoveNgsIndex(ngsIndex: NgsIndex) {
    if (ngsIndex?.id) {
      ngsIndexesToDelete.current.push(ngsIndex);
    }
  }

  return (
    <>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <SeqdbMessage id={title} />
        </h1>
        {id ? (
          withResponse(resourceQuery, ({ data }) => {
            return (
              <IndexSetForm
                dinaFormProps={{ initialValues: data, onSubmit }}
                onRemoveNgsIndex={onRemoveNgsIndex}
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
            onRemoveNgsIndex={onRemoveNgsIndex}
            buttonBar={buttonBar}
          />
        )}
      </main>
      <Footer />
    </>
  );
}

export function IndexSetForm({
  dinaFormProps,
  onRemoveNgsIndex,
  buttonBar
}: IndexSetFormProps) {
  return (
    <DinaForm<Partial<IndexSet>> {...dinaFormProps}>
      {buttonBar}
      <IndexSetFields onRemoveNgsIndex={onRemoveNgsIndex} />
    </DinaForm>
  );
}

/** Re-usable field layout between edit and view pages. */
function IndexSetFields({
  onRemoveNgsIndex
}: {
  onRemoveNgsIndex: (ngsIndex: NgsIndex) => void;
}) {
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
      <strong>NGS indexes:</strong>
      <NgsIndexField
        wrapContent={(content) => content}
        onRemoveNgsIndex={onRemoveNgsIndex}
      />
    </>
  );
}
