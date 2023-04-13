import { SelectField, useQuery, withResponse } from "common-ui";
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
import {
  CollectionModuleType,
  COLLECTION_MODULE_TYPES,
  COLLECTION_MODULE_TYPE_LABELS,
  ManagedAttribute
} from "../../../types/collection-api";

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
      <Link href="/managed-attribute/list?step=0">
        <a className="back-button my-auto me-auto">
          <DinaMessage id="backToList" />
        </a>
      </Link>
    ) : (
      <Link href={`/collection/managed-attribute/view?id=${id}`}>
        <a className="back-button my-auto me-auto">
          <DinaMessage id="backToReadOnlyPage" />
        </a>
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
