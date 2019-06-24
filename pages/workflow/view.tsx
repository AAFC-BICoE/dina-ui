import { Formik } from "formik";
import { FieldView, Head, Nav } from "../../components";

export default function ViewWorkflow() {
  return (
    <div>
      <Head title="Workflow" />
      <Nav />
      <div className="container-fluid">
        <Formik
          initialValues={{
            date: "2019-06-24",
            group: { groupName: "poffm" },
            name: "shotgun workflow 1",
            template: { name: "Shotgun Workflow" }
          }}
          onSubmit={null}
        >
          <>
            <h1>Workflow</h1>
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
                <FieldView name="template.name" />
                <FieldView label="Group" name="group.groupName" />
                <FieldView name="name" />
                <FieldView name="date" />
              </div>
            </div>
          </>
        </Formik>
      </div>
    </div>
  );
}
