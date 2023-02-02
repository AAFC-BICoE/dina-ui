import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  FieldView,
  SubmitButton,
  TextField,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { NextRouter, useRouter } from "next/router";
import { Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import {
  MultiligualName,
  Organization
} from "../../types/agent-api/resources/Organization";

interface OrganizationFormProps {
  organization?: Organization;
  router: NextRouter;
}

export type languageCode = "EN" | "FR";

export default function OrganizationEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();
  const title = id ? "editOrganizationTitle" : "addOrganizationTitle";

  const query = useQuery<Organization>({
    path: `agent-api/organization/${id}`
  });

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <DinaMessage id="editOrganizationTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <OrganizationForm organization={data} router={router} />
            ))}
          </div>
        ) : (
          <div>
            <h1>
              <DinaMessage id="addOrganizationTitle" />
            </h1>
            <OrganizationForm router={router} />
          </div>
        )}
      </main>
    </div>
  );
}

export const trimAliases = (aliases, isArray) => {
  let trimmedAliases;
  isArray
    ? (trimmedAliases = aliases
        .filter((a) => a.trim().length > 0)
        .map((a) => a.trim()))
    : (trimmedAliases = aliases
        .split(",")
        .filter((a) => a.trim().length > 0)
        .map((a) => a.trim()));
  return trimmedAliases;
};

function OrganizationForm({ organization, router }: OrganizationFormProps) {
  const { id } = router.query;
  const initialValues = organization || { type: "organization" };
  const { formatMessage } = useDinaIntl();

  if (organization) {
    organization.name = new Map();
    organization.name[organization.names[0].languageCode] =
      organization.names[0].name;
    organization.name[organization.names[1]?.languageCode] =
      organization.names[1]?.name;
  }

  const onSubmit: DinaFormOnSubmit = async ({
    api: { save },
    submittedValues
  }) => {
    const aliases = submittedValues.aliases;
    if (Array.isArray(aliases)) {
      aliases.length === 1
        ? (submittedValues.aliases = trimAliases(aliases[0], false))
        : (submittedValues.aliases = trimAliases(aliases, true));
    } else if (aliases !== null && aliases !== undefined) {
      submittedValues.aliases = trimAliases(aliases, false);
    }
    submittedValues.names = [];
    if (submittedValues.name !== undefined) {
      const multiligualName: MultiligualName[] = [];

      if (submittedValues.name.EN && submittedValues.name.FR) {
        multiligualName[0] = {
          languageCode: "EN",
          name: submittedValues.name.EN
        };

        multiligualName[1] = {
          languageCode: "FR",
          name: submittedValues.name.FR
        };
      } else if (submittedValues.name.EN) {
        multiligualName[0] = {
          languageCode: "EN",
          name: submittedValues.name.EN
        };
      } else if (submittedValues.name.FR) {
        multiligualName[0] = {
          languageCode: "FR",
          name: submittedValues.name.FR
        };
      } else {
        throw new Error(
          formatMessage("field_organizationMandatoryFieldsError")
        );
      }

      submittedValues.names = multiligualName;
      delete submittedValues.name;
    }

    await save(
      [
        {
          resource: submittedValues,
          type: "organization"
        }
      ],
      {
        apiBaseUrl: "/agent-api"
      }
    );

    await router.push(`/organization/list`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        <BackButton
          entityId={id as string}
          entityLink="/organization"
          byPassView={true}
        />
        <SubmitButton className="ms-auto" />
      </ButtonBar>
      <OrganizationFields />
    </DinaForm>
  );
}

export function OrganizationFields() {
  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <div className="row">
        <TextField
          className="col-md-4 nameEN"
          name="name.EN"
          label={formatMessage("organizationEnglishNameLabel")}
        />
      </div>
      <div className="row">
        <TextField
          className="col-md-4 nameFR"
          name="name.FR"
          label={formatMessage("organizationFrenchNameLabel")}
        />
      </div>
      <div className="row">
        <TextField
          className="col-md-4"
          name="aliases"
          label={formatMessage("editOrganizationAliasesLabel")}
        />
      </div>
      {readOnly && (
        <div className="row">
          <FieldView className="col-md-2" name="createdBy" />
          <FieldView className="col-md-2" name="createdOn" />
        </div>
      )}
    </div>
  );
}
