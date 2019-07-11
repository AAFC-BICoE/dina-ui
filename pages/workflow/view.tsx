import { Formik } from "formik";
import Link from "next/link";
import { withRouter, WithRouterProps } from "next/router";
import { FieldView, Head, LoadingSpinner, Nav, Query } from "../../components";

export function WorkflowDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;

  return (
    <div>
      <Head title="Workflow" />
      <Nav />
      <Query<any>
        query={{ include: "group,chainTemplate", path: `chain/${id}` }}
      >
        {({ loading, response }) => (
          <div className="container-fluid">
            <Link href="/workflow/list">
              <a>Workflow list</a>
            </Link>
            <h1>Workflow Details</h1>
            <LoadingSpinner loading={loading} />
            {response && (
              <Formik initialValues={response.data} onSubmit={null}>
                <>
                  <div className="btn-group">
                    {/* Replace with tabbed view */}
                    <button className="btn btn-info">Details</button>
                    <button className="btn btn-info">Step 1</button>
                    <button className="btn btn-info">Step 2</button>
                    <button className="btn btn-info">Step 3</button>
                    <button className="btn btn-info">Step 4</button>
                    <button className="btn btn-info">Step 5</button>
                  </div>
                  <div className="row">
                    <div className="col-md-2">
                      <FieldView label="Template" name="chainTemplate.name" />
                      <FieldView label="Group" name="group.groupName" />
                      <FieldView name="name" />
                      <FieldView name="dateCreated" />
                    </div>
                  </div>
                </>
              </Formik>
            )}
          </div>
        )}
      </Query>
    </div>
  );
}

export default withRouter(WorkflowDetailsPage);
