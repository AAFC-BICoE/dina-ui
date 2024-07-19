import { useQuery, withResponse } from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { withRouter } from "next/router";
import {
  ManagedAttributeForm,
  ManagedAttributeFormProps
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../../types/collection-api";
import PageLayout from "packages/dina-ui/components/page/PageLayout";

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
      <Link
        href="/managed-attribute/list?step=2"
        className="back-button my-auto me-auto"
      >
        <DinaMessage id="backToList" />
      </Link>
    ) : (
      <Link
        href={`/loan-transaction/managed-attribute/view?id=${id}`}
        className="back-button my-auto me-auto"
      >
        <DinaMessage id="backToReadOnlyPage" />
      </Link>
    );

  const formProps: ManagedAttributeFormProps = {
    router,
    postSaveRedirect: "/loan-transaction/managed-attribute/view",
    apiBaseUrl: "/loan-transaction-api",
    backButton
  };

  return (
    <PageLayout titleId={formatMessage(title)}>
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
        <ManagedAttributeForm {...formProps} />
      )}
    </PageLayout>
  );
}

export default withRouter(ManagedAttributesEditPage);
