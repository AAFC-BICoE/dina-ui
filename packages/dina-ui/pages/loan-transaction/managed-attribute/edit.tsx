import { useQuery, withResponse } from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import {
  Footer,
  Head,
  ManagedAttributeForm,
  ManagedAttributeFormProps,
  Nav
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../../types/collection-api/resources/ManagedAttribute";

export function ManagedAttributesEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();
  const title = id ? "editManagedAttributeTitle" : "addManagedAttributeTitle";

  const query = useQuery<ManagedAttribute>(
    {
      path: `loan-transaction-api/managed-attribute/${id}`
    },
    { disabled: id === undefined }
  );

  const formProps: ManagedAttributeFormProps = {
    router,
    postSaveRedirect: "/managed-attribute/list?step=2",
    apiBaseUrl: "/loan-transaction-api",
    listHref: "/managed-attribute/list?step=2"
  };

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <DinaMessage id="editManagedAttributeTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <ManagedAttributeForm
                {...formProps}
                fetchedManagedAttribute={data}
              />
            ))}
          </div>
        ) : (
          <div>
            <h1>
              <DinaMessage id="addManagedAttributeTitle" />
            </h1>
            <ManagedAttributeForm {...formProps} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default withRouter(ManagedAttributesEditPage);
