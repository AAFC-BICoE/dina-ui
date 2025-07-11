import {
  ApiClientContext,
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  TextField,
  useQuery,
  withResponse,
  MultilingualTitle,
  SelectField
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import _ from "lodash";
import { useRouter } from "next/router";
import { Fragment, useContext } from "react";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { AgentIdentifierType } from "../../types/agent-api/resources/AgentIdentifierType";
import { Head, Nav, Footer } from "../../components";
import Link from "next/link";
import {
  CollectionModuleType,
  COLLECTION_MODULE_TYPES,
  COLLECTION_MODULE_TYPE_LABELS
} from "packages/dina-ui/types/collection-api";

interface IdentifierFormProps {
  fetchedIdentifierType?: AgentIdentifierType;
  onSaved: (
    identifierType: PersistedResource<AgentIdentifierType>
  ) => Promise<void>;
}

export default function IdentifierTypeEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();

  async function goToViewPage(
    identifier: PersistedResource<AgentIdentifierType>
  ) {
    await router.push(`/identifier/view?id=${identifier.id}`);
  }

  const title = id ? "editIdentifierTitle" : "addIdentifier";

  const query = useQuery<AgentIdentifierType>(
    {
      path: `agent-api/identifier-type/${id}`
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
          </h1>
          {id ? (
            withResponse(query, ({ data }) => (
              <IdentifierTypeForm
                fetchedIdentifierType={data}
                onSaved={goToViewPage}
              />
            ))
          ) : (
            <IdentifierTypeForm onSaved={goToViewPage} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function IdentifierTypeForm({
  fetchedIdentifierType,
  onSaved
}: IdentifierFormProps) {
  const { apiClient } = useContext(ApiClientContext);

  const initialValues: AgentIdentifierType = fetchedIdentifierType
    ? {
        ...fetchedIdentifierType,
        // Convert multilingualDescription to editable Dictionary format:
        multilingualTitle: _.fromPairs<string | undefined>(
          fetchedIdentifierType.multilingualTitle?.titles?.map(
            ({ title, lang }) => [lang ?? "", title ?? ""]
          )
        )
      }
    : { type: "identifier-type" };

  const onSubmit: DinaFormOnSubmit<AgentIdentifierType> = async ({
    submittedValues
  }) => {
    const input: InputResource<AgentIdentifierType> = {
      ...submittedValues,
      //   Convert the editable format to the stored format:
      multilingualTitle: {
        titles: _.toPairs(submittedValues.multilingualTitle).map(
          ([lang, title]) => ({ lang, title })
        )
      }
    };
    const { id, type, ...resource } = input;

    let savedIdentifierType;
    if (fetchedIdentifierType) {
      savedIdentifierType = await apiClient.axios.patch(
        `agent-api/identifier-type/${fetchedIdentifierType.id}`,
        {
          data: {
            id: id,
            type: type,
            attributes: {
              ...resource,
              ...(resource.uriTemplate && {
                uriTemplate: resource.uriTemplate.includes("$1")
                  ? resource.uriTemplate
                  : `${resource.uriTemplate}$1`
              })
            }
          }
        },
        {
          headers: {
            "Content-Type": "application/vnd.api+json"
          }
        }
      );
    } else {
      savedIdentifierType = await apiClient.axios.post(
        `agent-api/identifier-type`,
        {
          data: {
            type: type,
            attributes: {
              ...resource,
              ...(resource.uriTemplate && {
                uriTemplate: resource.uriTemplate.includes("$1")
                  ? resource.uriTemplate
                  : `${resource.uriTemplate}$1`
              })
            }
          }
        },
        {
          headers: {
            "Content-Type": "application/vnd.api+json"
          }
        }
      );
    }

    await onSaved(savedIdentifierType?.data?.data);
  };

  return (
    <DinaForm<AgentIdentifierType>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <ButtonBar className="mb-4">
        <div className="col-md-6 col-sm-12 mt-2">
          <BackButton
            entityId={fetchedIdentifierType?.id}
            entityLink="/identifier"
          />
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
      </ButtonBar>
      <IdentifierTypeFormLayout />
    </DinaForm>
  );
}

export function IdentifierTypeFormLayout() {
  const { formatMessage } = useDinaIntl();

  const DINA_COMPONENT_OPTIONS: {
    label: string;
    value: CollectionModuleType;
  }[] = COLLECTION_MODULE_TYPES.map((dataType) => ({
    label: formatMessage(COLLECTION_MODULE_TYPE_LABELS[dataType] as any),
    value: dataType
  }));
  return (
    <div>
      <div className="row">
        <TextField className="col-md-6" name="name" />
        <TextField className="col-md-6" name="key" disabled={true} />
      </div>
      <div className="row">
        <TextField className="col-md-6" name="term" />
        <TextField
          className="col-md-6"
          name={"uriTemplate"}
          readOnlyRender={(value) => {
            try {
              const url = new URL(value);
              if (url.protocol === "http:" || url.protocol === "https:") {
                return (
                  <Fragment key={value}>
                    <Link href={value} passHref={true}>
                      {value}
                    </Link>
                  </Fragment>
                );
              }
            } catch (_) {
              return value;
            }
          }}
        />
      </div>
      <div className="row">
        <SelectField
          className="col-md-6"
          name="dinaComponents"
          options={DINA_COMPONENT_OPTIONS}
          isMulti={true}
        />
      </div>
      <MultilingualTitle />
    </div>
  );
}
