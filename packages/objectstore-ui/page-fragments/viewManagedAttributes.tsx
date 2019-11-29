import { FieldView, Query } from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { ManagedAttribute } from "types/objectstore-api/resources/ManagedAttribute";
import { MetaManagedAttribute } from "types/objectstore-api/resources/MetaManagedAttribute";

/* tslint:disable:no-string-literal */
export function generateManagedAttributesView(ma) {
  return (
    <Query<MetaManagedAttribute>
      query={{
        include: "managedAttribute",
        path: "metadata-managed-attribute/" + ma.id
      }}
    >
      {({ response }) => (
        <div>
          {response && (
            <Formik<ManagedAttribute> initialValues={ma} onSubmit={noop}>
              <div className="row">
                <label className="col-sm-2">
                  <strong>
                    {response.data["managedAttribute"]
                      ? response.data["managedAttribute"].name
                      : null}
                  </strong>
                </label>
                <div className="col">
                  <FieldView
                    className="col-sm-6"
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
/* tslint:enable:no-string-literal */
