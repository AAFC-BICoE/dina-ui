import { SelectField, useQuery, withResponse } from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import {
  Footer,
  Head,
  Nav,
  ManagedAttributeForm,
  ManagedAttributeFormProps
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  CollectionModuleType,
  COLLECTION_MODULE_TYPES,
  COLLECTION_MODULE_TYPE_LABELS,
  ManagedAttribute
} from "../../../types/collection-api/resources/ManagedAttribute";

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

  const formProps: ManagedAttributeFormProps = {
    router,
    postSaveRedirect: "/managed-attribute/list?step=0",
    apiBaseUrl: "/collection-api",
    listHref: "/managed-attribute/list?step=0",
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
