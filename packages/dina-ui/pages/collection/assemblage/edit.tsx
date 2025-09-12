import {
  ApiClientContext,
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  TextField,
  useDinaFormContext,
  useQuery,
  withResponse,
  Tooltip,
  generateUUIDTree,
  CustomQueryPageView,
  MultilingualDescription,
  MultilingualTitle
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import _ from "lodash";
import { useRouter } from "next/router";
import { Assemblage } from "../../../..//dina-ui/types/collection-api/resources/Assemblage";
import { useContext } from "react";
import {
  AttachmentsField,
  Footer,
  GroupSelectField,
  Head,
  Nav
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ManagedAttributesEditor } from "../../../components/managed-attributes/ManagedAttributesEditor";
import { useMaterialSampleRelationshipColumns } from "../../../components/collection/material-sample/useMaterialSampleRelationshipColumns";

interface AssemblageFormProps {
  fetchedAssemblage?: Assemblage;
  onSaved: (assemblage: PersistedResource<Assemblage>) => Promise<void>;
}

export default function AssemblageEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();

  async function goToViewPage(assemblage: PersistedResource<Assemblage>) {
    await router.push(`/collection/assemblage/view?id=${assemblage.id}`);
  }

  const title = id ? "editAssemblageTitle" : "addAssemblageTitle";

  const query = useQuery<Assemblage>(
    {
      path: `collection-api/assemblage/${id}?include=attachment`
    },
    { disabled: !id }
  );

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        <div>
          <h1 id="wb-cont">
            <DinaMessage id={title} />
            <Tooltip
              id={"assemblage_tooltip"}
              link={
                "https://aafc-bicoe.github.io/dina-documentation/#assemblage"
              }
              linkText={"fromDinaUserGuide"}
              placement={"right"}
            />
          </h1>
          {id ? (
            withResponse(query, ({ data }) => (
              <AssemblageForm fetchedAssemblage={data} onSaved={goToViewPage} />
            ))
          ) : (
            <AssemblageForm onSaved={goToViewPage} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export interface AssemblageFormValues extends InputResource<Assemblage> {}

export function AssemblageForm({
  fetchedAssemblage,
  onSaved
}: AssemblageFormProps) {
  const { save } = useContext(ApiClientContext);

  const initialValues: AssemblageFormValues = fetchedAssemblage
    ? {
        ...fetchedAssemblage,
        // Convert multilingualDescription to editable Dictionary format:
        multilingualTitle: _.fromPairs<string | undefined>(
          fetchedAssemblage.multilingualTitle?.titles?.map(
            ({ title, lang }) => [lang ?? "", title ?? ""]
          )
        ),
        multilingualDescription: _.fromPairs<string | undefined>(
          fetchedAssemblage.multilingualDescription?.descriptions?.map(
            ({ desc, lang }) => [lang ?? "", desc ?? ""]
          )
        )
      }
    : { type: "assemblage" };

  const onSubmit: DinaFormOnSubmit<AssemblageFormValues> = async ({
    submittedValues
  }) => {
    (submittedValues as any).relationships = {};

    const input: InputResource<Assemblage> = {
      ...submittedValues,
      // Convert the editable format to the stored format:
      multilingualTitle: {
        titles: _.toPairs(submittedValues.multilingualTitle).map(
          ([lang, title]) => ({ lang, title })
        )
      },
      multilingualDescription: {
        descriptions: _.toPairs(submittedValues.multilingualDescription).map(
          ([lang, desc]) => ({ lang, desc })
        )
      }
    };

    // Add attachments if they were selected:
    (input as any).relationships.attachment = {
      data:
        input.attachment?.map((it) => ({
          id: it.id,
          type: it.type
        })) ?? []
    };

    // Delete the 'attachment' attribute because it should stay in the relationships field:
    delete input.attachment;

    const [savedAssemblage] = await save<Assemblage>(
      [
        {
          resource: input,
          type: "assemblage"
        }
      ],
      {
        apiBaseUrl: "/collection-api"
      }
    );
    await onSaved(savedAssemblage);
  };

  return (
    <DinaForm<AssemblageFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <ButtonBar className="mb-4">
        <div className="col-md-6 col-sm-12 mt-2">
          <BackButton
            entityId={fetchedAssemblage?.id}
            entityLink="/collection/assemblage"
          />
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
      </ButtonBar>
      <AssemblageFormLayout />
    </DinaForm>
  );
}

export function AssemblageFormLayout() {
  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();
  const router = useRouter();
  const uuid = String(router?.query?.id);
  const { ELASTIC_SEARCH_COLUMN } = useMaterialSampleRelationshipColumns();
  const customViewQuery = generateUUIDTree(
    uuid,
    "data.relationships.assemblages.data.id"
  );

  return (
    <div>
      <div className="row">
        <TextField
          className="col-md-6 name"
          name="name"
          label={formatMessage("field_assemblageName")}
        />
        {!readOnly && (
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-6"
          />
        )}
      </div>
      <MultilingualTitle />
      <MultilingualDescription />
      <ManagedAttributesEditor
        valuesPath="managedAttributes"
        managedAttributeApiPath="collection-api/managed-attribute"
        managedAttributeComponent="ASSEMBLAGE"
        fieldSetProps={{
          legend: <DinaMessage id="assemblageManagedAttributes" />
        }}
      />
      <AttachmentsField
        name="attachment"
        title={<DinaMessage id="assemblageAttachments" />}
        formId="assemblage-attachments-section"
        allowNewFieldName="attachmentsConfig.allowNew"
        allowExistingFieldName="attachmentsConfig.allowExisting"
        hideAddAttchmentBtn={true}
      />
      {readOnly && (
        <CustomQueryPageView
          titleKey="attachedMaterialSamples"
          uniqueName="attached-material-samples-assemblages"
          columns={ELASTIC_SEARCH_COLUMN}
          indexName={"dina_material_sample_index"}
          viewMode={readOnly}
          customViewQuery={readOnly ? customViewQuery : undefined}
          customViewFields={
            readOnly
              ? [
                  {
                    fieldName: "data.relationships.assemblages.data.id",
                    type: "uuid"
                  }
                ]
              : undefined
          }
          reactTableProps={{
            enableSorting: true,
            enableMultiSort: true
          }}
        />
      )}
    </div>
  );
}
