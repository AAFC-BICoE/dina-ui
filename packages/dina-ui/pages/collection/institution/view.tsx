import { DinaForm, useQuery, withResponse } from "common-ui";
import { fromPairs } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Head, Nav, ResourceViewButtonBar } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { Institution } from "../../../types/collection-api";
import { InstitutionFormLayout } from "./edit";

export function InstitutionDetailsPage({ router }: WithRouterProps) {
  const id = String(router.query.id);
  const { formatMessage } = useDinaIntl();

  const institutionQuery = useQuery<Institution>({
    path: `collection-api/institution/${id}`,
    header: { "include-dina-permission": "true" }
  });

  return (
    <div>
      <Head title={formatMessage("institution")} />
      <Nav />
      <main className="container">
        {withResponse(institutionQuery, ({ data: institution }) => (
          <DinaForm<Institution>
            initialValues={{
              ...institution,
              // Convert multilingualDescription to editable Dictionary format:
              multilingualDescription: fromPairs<string | undefined>(
                institution.multilingualDescription?.descriptions?.map(
                  ({ desc, lang }) => [lang ?? "", desc ?? ""]
                )
              )
            }}
            readOnly={true}
          >
            <ResourceViewButtonBar
              resource={institution}
              apiBaseUrl="/collection-api"
              resourceBaseUrl="collection/institution"
              withLeadingSlash={true}
            />
            <InstitutionFormLayout />
          </DinaForm>
        ))}
      </main>
    </div>
  );
}

export default withRouter(InstitutionDetailsPage);
