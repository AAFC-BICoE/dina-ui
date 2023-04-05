import { useQuery, withResponse } from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { withRouter } from "next/router";
import {
  Footer,
  Head,
  ManagedAttributeForm,
  ManagedAttributeFormProps,
  Nav
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../../types/collection-api";

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

  const backButton =
    id === undefined ? (
      <Link href="/managed-attribute/list?step=2">
        <a className="back-button my-auto me-auto">
          <DinaMessage id="backToList" />
        </a>
      </Link>
    ) : (
      <Link href={`/loan-transaction/managed-attribute/view?id=${id}`}>
        <a className="back-button my-auto me-auto">
          <DinaMessage id="backToReadOnlyPage" />
        </a>
      </Link>
    );

  const formProps: ManagedAttributeFormProps = {
    router,
    postSaveRedirect: "/loan-transaction/managed-attribute/view",
    apiBaseUrl: "/loan-transaction-api",
    backButton
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
