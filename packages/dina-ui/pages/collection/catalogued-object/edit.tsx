import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  DinaFormSection,
  FieldSet,
  LoadingSpinner,
  Query,
  SubmitButton,
  TextField,
  useApiClient
} from "common-ui";
import { useRouter } from "next/router";
import { GroupSelectField, Head, Nav } from "../../../components";
import { CollectingEventFormLayout } from "../../../components/collection/CollectingEventFormLayout";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { PhysicalEntity } from "../../../types/collection-api";

export default function CataloguedObjectEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();

  async function viewNewCataloguedObject(savedId: string) {
    await router.push(`/collection/catalogued-object/view?id=${savedId}`);
  }

  return (
    <div>
      <Head title={formatMessage("editCataloguedObjectTitle")} />
      <Nav />
      <div className="container">
        {id ? (
          <div>
            <h1>
              <DinaMessage id="editCataloguedObjectTitle" />
            </h1>
            <Query<PhysicalEntity>
              query={{
                path: `collection-api/physical-entity/${id}`
              }}
            >
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response?.data && (
                    <CataloguedObjectForm
                      cataloguedObject={response?.data}
                      onSaved={viewNewCataloguedObject}
                    />
                  )}
                </div>
              )}
            </Query>
          </div>
        ) : (
          <div>
            <h1>
              <DinaMessage id="addCataloguedObjectTitle" />
            </h1>
            <CataloguedObjectForm onSaved={viewNewCataloguedObject} />
          </div>
        )}
      </div>
    </div>
  );
}

export interface CataloguedObjectFormProps {
  cataloguedObject?: PhysicalEntity;
  onSaved?: (id: string) => Promise<void>;
}

export function CataloguedObjectForm({
  cataloguedObject,
  onSaved
}: CataloguedObjectFormProps) {
  const { save } = useApiClient();

  const initialValues: Partial<PhysicalEntity> = cataloguedObject
    ? cataloguedObject
    : {};

  const onSubmit: DinaFormOnSubmit = async ({ submittedValues }) => {
    const [savedPhysicalEntity] = await save<PhysicalEntity>(
      [
        {
          resource: submittedValues,
          type: "physical-entity"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    await onSaved?.(savedPhysicalEntity.id);
  };

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={cataloguedObject?.id}
        entityLink="/collection/catalogued-object"
      />
      <SubmitButton className="ml-auto" />
    </ButtonBar>
  );

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      {buttonBar}
      <CataloguedObjectFormLayout />
      {buttonBar}
    </DinaForm>
  );
}

/** Fields layout re-useable between view and edit pages. */
export function CataloguedObjectFormLayout() {
  return (
    <div>
      <div className="row">
        <div className="col-md-6">
          <DinaFormSection horizontal={true}>
            <GroupSelectField name="group" enableStoredDefaultGroup={true} />
            <TextField name="dwcCatalogNumber" />
          </DinaFormSection>
        </div>
        <div className="col-md-6">
          <FieldSet
            legend={<DinaMessage id="preparationData" />}
            horizontal={true}
            readOnly={true} // Disabled until back-end supports these fields.
          >
            <TextField name="preparationMethod" />
            <TextField name="preparedBy" />
            <DateField name="datePrepared" />
          </FieldSet>
        </div>
      </div>
      <FieldSet legend={<DinaMessage id="collectingEvent" />}>
        {/* <CollectingEventFormLayout /> */}
      </FieldSet>
    </div>
  );
}
