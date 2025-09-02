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
      path: `objectstore-api/managed-attribute/${id}`
    },
    { disabled: id === undefined }
  );

  const backButton =
    id === undefined ? (
      <Link
        href="/managed-attribute/list?tab=1"
        className="back-button my-auto me-auto"
      >
        <DinaMessage id="backToList" />
      </Link>
    ) : (
      <Link
        href={`/object-store/managed-attribute/view?id=${id}`}
        className="back-button my-auto me-auto"
      >
        <DinaMessage id="backToReadOnlyPage" />
      </Link>
    );

  const formProps: ManagedAttributeFormProps = {
    router,
    postSaveRedirect: "/object-store/managed-attribute/view",
    apiBaseUrl: "/objectstore-api",
    backButton
  };

  return (
    <PageLayout titleId={formatMessage(title)}>
      {id ? (
        <div>
          {withResponse(query, ({ data }) => (
            <ManagedAttributeForm
              {...formProps}
              fetchedManagedAttribute={data}
              withGroup={false}
            />
          ))}
        </div>
      ) : (
        <ManagedAttributeForm {...formProps} withGroup={false} />
      )}
    </PageLayout>
  );
}

export default withRouter(ManagedAttributesEditPage);
