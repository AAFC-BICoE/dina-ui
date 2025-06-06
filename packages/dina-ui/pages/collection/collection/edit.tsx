import {
  BackButton,
  DateField,
  DinaForm,
  DinaFormSubmitParams,
  SubmitButton,
  TextField,
  useDinaFormContext,
  useQuery,
  withResponse,
  ResourceSelectField,
  filterBy,
  SelectOption,
  MultilingualDescription,
  ButtonBar
} from "common-ui";
import { PersistedResource } from "kitsu";
import { NextRouter, useRouter } from "next/router";
import { GroupSelectField, IdentifierFields } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { Collection } from "../../../types/collection-api";
import _ from "lodash";
import { Field } from "formik";
import { CollectionIdentifierType } from "../../../types/collection-api/resources/CollectionIdentifier";
import PageLayout from "../../../components/page/PageLayout";

export default function CollectionEditPage() {
  const router = useRouter();

  const {
    query: { id }
  } = router;

  const collectionQuery = useQuery<Collection>(
    {
      path: `collection-api/collection/${id}`,
      include: "institution,parentCollection"
    },
    { disabled: !id }
  );

  const title = id ? "editCollectionTitle" : "addCollectionTitle";

  return (
    <PageLayout titleId={title}>
      {id ? (
        withResponse(collectionQuery, ({ data }) => (
          <CollectionForm collection={data} router={router} />
        ))
      ) : (
        <CollectionForm router={router} />
      )}
    </PageLayout>
  );
}

export interface CollectionFormProps {
  collection?: PersistedResource<Collection>;
  router: NextRouter;
}

export function CollectionForm({ collection, router }: CollectionFormProps) {
  const initialValues = collection
    ? {
        ...collection,
        // Convert multilingualDescription to editable Dictionary format:
        multilingualDescription: _.fromPairs<string | undefined>(
          collection.multilingualDescription?.descriptions?.map(
            ({ desc, lang }) => [lang ?? "", desc ?? ""]
          )
        )
      }
    : { type: "collection", institution: undefined };

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<Collection>) {
    const input: Collection = {
      ...submittedValues,
      // Convert the editable format to the stored format:
      multilingualDescription: {
        descriptions: _.toPairs(submittedValues.multilingualDescription).map(
          ([lang, desc]) => ({ lang, desc: desc as any })
        )
      }
    };

    const [savedCollection] = await save(
      [
        {
          resource: input,
          type: "collection"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    await router.push(`/collection/collection/view?id=${savedCollection.id}`);
  }

  const buttonBar = (
    <ButtonBar className="mb-4">
      <div className="col-md-6 col-sm-12 mt-2">
        <BackButton
          entityId={collection?.id}
          entityLink="/collection/collection"
        />
      </div>
      <div className="col-md-6 col-sm-12 d-flex">
        <SubmitButton className="ms-auto" />
      </div>
    </ButtonBar>
  );

  return (
    <DinaForm<Collection> initialValues={initialValues} onSubmit={onSubmit}>
      {buttonBar}
      <CollectionFormFields />
    </DinaForm>
  );
}

/** Re-usable field layout between edit and view pages. */
export function CollectionFormFields() {
  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();
  const typeOptions: SelectOption<string | undefined>[] = [
    {
      label: CollectionIdentifierType.GRSCICOLL,
      value: CollectionIdentifierType.GRSCICOLL
    },
    {
      label: CollectionIdentifierType.INDEX_HERBARIORUM,
      value: CollectionIdentifierType.INDEX_HERBARIORUM
    }
  ];

  const filter = filterBy(["name"], {
    nullValueFilters: { parentCollection: null }
  });

  return (
    <div>
      <div className="row">
        {/* <ResourceSelectField<Institution>
          name="institution"
          readOnlyLink="/collection/institution/view?id="
          filter={filterBy(["name"])}
          model="collection-api/institution"
          optionLabel={institution => institution.name as any}
          className="col-md-6"
        /> */}
        <ResourceSelectField<Collection>
          name="parentCollection"
          readOnlyLink="/collection/collection/view?id="
          filter={filter}
          model="collection-api/collection"
          optionLabel={(collection) => collection.name as any}
          className="col-md-6"
          label={formatMessage("parentCollectionLabel")}
        />
        <TextField className="col-md-6" name="code" noSpace={true} />
      </div>
      <div className="row">
        <TextField className="col-md-6" name="name" />
        {!readOnly && (
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-6"
            showAllGroups={true}
          />
        )}
      </div>
      <MultilingualDescription />
      <div className="row">
        <TextField className="col-md-6" name="webpage" />
        <TextField className="col-md-6" name="contact" />
      </div>
      <div className="row">
        <TextField className="col-md-6" name="address" multiLines={true} />
        <TextField className="col-md-6" name="remarks" multiLines={true} />
      </div>
      <Field name="identifiers">
        {({ form: { values: formState } }) =>
          !readOnly ? (
            <IdentifierFields typeOptions={typeOptions} />
          ) : !!formState.identifiers?.length ? (
            <IdentifierFields typeOptions={typeOptions} />
          ) : null
        }
      </Field>
      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" name="createdOn" />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </div>
  );
}
