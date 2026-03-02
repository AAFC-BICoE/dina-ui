import {
  BackButton,
  ButtonBar,
  DinaForm,
  FieldView,
  SubmitButton,
  TextField,
  useDinaFormContext,
  useSubmitHandler
} from "common-ui";
import { Organization } from "../../types/agent-api";
import { NextRouter } from "next/router";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { useMemo } from "react";
import { MultiligualName } from "packages/dina-ui/types/common/resources/MultilingualName";

interface OrganizationFormProps {
  organization?: Organization;
  router: NextRouter;
}

export function OrganizationForm({
  organization,
  router
}: OrganizationFormProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();

  const initialValues = useMemo(() => {
    if (!organization) return { type: "organization" };

    const initialNames: any = {};
    organization.names?.forEach((n) => {
      initialNames[n.languageCode] = n.name;
    });

    return {
      ...organization,
      name: initialNames
    };
  }, [organization]);

  const organizationSubmitHandler = useSubmitHandler<Organization>({
    original: initialValues as Organization,
    resourceType: "organization",
    saveOptions: {
      apiBaseUrl: "/agent-api",
      skipOperationForSingleRequest: true
    },

    transforms: [
      (values) => {
        const transformed = { ...values };

        // Handle Aliases Logic
        const aliases = transformed.aliases;
        if (Array.isArray(aliases)) {
          transformed.aliases = trimAliases(
            aliases.length === 1 ? aliases[0] : aliases,
            aliases.length !== 1
          );
        } else if (aliases) {
          transformed.aliases = trimAliases(aliases, false);
        }

        // Handle Multilingual Names Logic
        const multilingualNames: MultiligualName[] = [];
        if ((transformed as any).name?.EN) {
          multilingualNames.push({
            languageCode: "EN",
            name: (transformed as any).name.EN
          });
        }
        if ((transformed as any).name?.FR) {
          multilingualNames.push({
            languageCode: "FR",
            name: (transformed as any).name.FR
          });
        }

        // Validation
        if (multilingualNames.length === 0) {
          throw new Error(
            formatMessage("field_organizationMandatoryFieldsError")
          );
        }

        transformed.names = multilingualNames;
        delete transformed.name;

        return transformed;
      }
    ],

    // Post-save navigation
    onSuccess: async (saved) => {
      await router.push(`/organization/view?id=${saved.id}`);
    }
  });

  const buttonBar = (
    <ButtonBar className="mb-3">
      <div className="col-md-6 col-sm-12 mt-2">
        <BackButton
          entityId={id as string}
          entityLink="/organization"
          byPassView={true}
        />
      </div>
      <div className="col-md-6 col-sm-12 d-flex">
        <SubmitButton className="ms-auto" />
      </div>
    </ButtonBar>
  );

  return (
    <DinaForm
      initialValues={initialValues}
      onSubmit={organizationSubmitHandler}
    >
      {buttonBar}
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

export const trimAliases = (aliases, isArray) => {
  let trimmedAliases;
  if (isArray) {
    trimmedAliases = aliases
      .filter((a: string) => a.trim().length > 0)
      .map((a: string) => a.trim());
  } else {
    trimmedAliases = aliases
      .split(",")
      .filter((a: string) => a.trim().length > 0)
      .map((a: string) => a.trim());
  }
  return trimmedAliases;
};
