import { SelectField, useQuery, withResponse } from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { withRouter } from "next/router";
import {
  ManagedAttributeForm,
  ManagedAttributeFormProps
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  CollectionModuleType,
  COLLECTION_MODULE_TYPES,
  COLLECTION_MODULE_TYPE_LABELS,
  ManagedAttribute
} from "../../../types/collection-api";
import PageLayout from "packages/dina-ui/components/page/PageLayout";

export function ManagedAttributesEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();
  const title = id ? "editManagedAttributeTitle" : "addManagedAttributeTitle";

  const query = useQuery<ManagedAttribute>(
    {
      path: `collection-api/managed-attribute/${id}`
    },
    { disabled: id === undefined }
  );

  const ATTRIBUTE_COMPONENT_OPTIONS: {
    label: string;
    value: CollectionModuleType;
  }[] = COLLECTION_MODULE_TYPES.map((dataType) => ({
    label: formatMessage(COLLECTION_MODULE_TYPE_LABELS[dataType] as any),
    value: dataType
  }));

  const backButton =
    id === undefined ? (
      <Link
        href="/managed-attribute/list?tab=0"
        className="back-button my-auto me-auto"
      >
        <DinaMessage id="backToList" />
      </Link>
    ) : (
      <Link
        href={`/collection/managed-attribute/view?id=${id}`}
        className="back-button my-auto me-auto"
      >
        <DinaMessage id="backToReadOnlyPage" />
      </Link>
    );

  const formProps: ManagedAttributeFormProps = {
    router,
    postSaveRedirect: "/collection/managed-attribute/view",
    apiBaseUrl: "/collection-api",
    backButton,
    componentField: (
      <SelectField
        className="col-md-6"
        name="managedAttributeComponent"
        options={ATTRIBUTE_COMPONENT_OPTIONS}
      />
    )
  };

  return (
    <PageLayout titleId={formatMessage(title)}>
      {id ? (
        <div>
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
