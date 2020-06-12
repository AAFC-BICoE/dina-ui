import { FieldView, Query } from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { ManagedAttribute } from "types/objectstore-api/resources/ManagedAttribute";
import { MetaManagedAttribute } from "types/objectstore-api/resources/MetaManagedAttribute";

interface GenerateManagedAttributesViewProps {
  ma: ManagedAttribute;
}
/* tslint:disable:no-string-literal */
export function GenerateManagedAttributesView({
  ma
}: GenerateManagedAttributesViewProps) {
  return (
    <Query<MetaManagedAttribute>
      query={{
        include: "managedAttribute",
        path: "objectstore-api/metadata-managed-attribute/" + ma.id
      }}
    >
      {({ response }) => (
        <div>
          {response && (
            <Formik<ManagedAttribute> initialValues={ma} onSubmit={noop}>
              <div className="row">
                <label className="col-md-3">
                  <strong>
                    {response.data["managedAttribute"]
                      ? response.data["managedAttribute"].name
                      : null}
                  </strong>
                </label>
                <div className="col">
                  <FieldView
                    className="col-md-9"
                    name="assignedValue"
                    hideLabel={true}
                  />
                </div>
              </div>
            </Formik>
          )}
        </div>
      )}
    </Query>
  );
}

export default GenerateManagedAttributesView;
/* tslint:enable:no-string-literal */
