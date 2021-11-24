import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  FieldSet,
  filterBy,
  ResourceSelectField,
  SubmitButton,
  TextField,
  useQuery,
  withResponse
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import {
  Footer,
  GroupSelectField,
  Head,
  Nav,
  useAddPersonModal
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Person } from "../../../types/agent-api";
import { AcquisitionEvent } from "../../../types/collection-api";

export default function AcquisitionEventEditPage() {
  const router = useRouter();
  const { formatMessage } = useDinaIntl();

  const id = router.query.id?.toString();

  const acquisitionEventQuery = useAcquisitionEvent(id);

  const title = id ? "editAcquisitionEventTitle" : "addAcquisitionEventTitle";

  async function moveToViewPage(saved: PersistedResource<AcquisitionEvent>) {
    await router.push(`/collection/acquisition-event/view?id=${saved.id}`);
  }

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container">
        <h1 id="wb-cont">
          <DinaMessage id={title} />
        </h1>
        {id ? (
          withResponse(acquisitionEventQuery, ({ data }) => (
            <AcquisitionEventForm
              acquisitionEvent={data}
              onSaved={moveToViewPage}
            />
          ))
        ) : (
          <AcquisitionEventForm onSaved={moveToViewPage} />
        )}
      </main>
      <Footer />
    </div>
  );
}

interface AcquisitionEventFormProps {
  acquisitionEvent?: PersistedResource<AcquisitionEvent>;
  onSaved: (saved: PersistedResource<AcquisitionEvent>) => Promise<void>;
}

function AcquisitionEventForm({
  acquisitionEvent,
  onSaved
}: AcquisitionEventFormProps) {
  const initialValues = acquisitionEvent ?? {};

  const onSubmit: DinaFormOnSubmit = async ({
    submittedValues,
    api: { save }
  }) => {
    const [saved] = await save<AcquisitionEvent>(
      [
        {
          resource: submittedValues,
          type: "acquisition-event"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    await onSaved(saved);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        <BackButton
          entityId={acquisitionEvent?.id}
          entityLink="/collection/acquisition-event"
        />
        <SubmitButton className="ms-auto" />
      </ButtonBar>
      <AcquisitionEventFormLayout />
    </DinaForm>
  );
}

export function useAcquisitionEvent(id?: string | null) {
  return useQuery<AcquisitionEvent>(
    {
      path: `collection-api/acquisition-event/${id}`,
      include: "receivedFrom,externallyIsolatedBy"
    },
    { disabled: !id }
  );
}

export function AcquisitionEventFormLayout() {
  const { openAddPersonModal } = useAddPersonModal();

  return (
    <div>
      <FieldSet legend={<DinaMessage id="reception" />} className="non-strip">
        <div className="row">
          <GroupSelectField
            className="col-sm-6"
            name="group"
            enableStoredDefaultGroup={true}
          />
        </div>
        <div className="row">
          <div className="col-sm-6">
            <ResourceSelectField<Person>
              name="receivedFrom"
              readOnlyLink="/person/view?id="
              filter={filterBy(["displayName"])}
              model="agent-api/person"
              optionLabel={person => person.displayName}
              asyncOptions={[
                {
                  label: <DinaMessage id="addNewPerson" />,
                  getResource: openAddPersonModal
                }
              ]}
            />
            <DateField name="receivedDate" />
          </div>
          <div className="col-sm-6 receptionRemarks">
            <TextField name="receptionRemarks" multiLines={true} />
          </div>
        </div>
      </FieldSet>
      <FieldSet legend={<DinaMessage id="isolation" />} className="non-strip">
        <div className="row">
          <div className="col-sm-6">
            <ResourceSelectField<Person>
              name="externallyIsolatedBy"
              readOnlyLink="/person/view?id="
              filter={filterBy(["displayName"])}
              model="agent-api/person"
              optionLabel={person => person.displayName}
              asyncOptions={[
                {
                  label: <DinaMessage id="addNewPerson" />,
                  getResource: openAddPersonModal
                }
              ]}
            />
            <DateField name="externallyIsolatedOn" />
          </div>
          <TextField
            name="externallyIsolationRemarks"
            className="col-sm-6"
            multiLines={true}
          />
        </div>
      </FieldSet>
    </div>
  );
}
