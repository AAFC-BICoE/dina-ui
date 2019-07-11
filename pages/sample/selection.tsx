import { Form, Formik, FormikActions } from "formik";
import { FilterParam } from "kitsu";
import { useState } from "react";
import ReactTable from "react-table";
import {
  ColumnDefinition,
  FilterBuilderField,
  Head,
  Nav,
  QueryTable
} from "../../components";
import { rsql } from "../../components/filter-builder/rsql";

export default function() {
  const [filter, setFilter] = useState<FilterParam>();
  const [selected, setSelected] = useState([]);

  const SAMPLE_COLUMNS: Array<ColumnDefinition<any>> = [
    {
      Header: "Group Name",
      accessor: "group.groupName"
    },
    "name",
    "version",
    {
      Cell: ({ original }) => (
        <>
          <div className="row">
            <button
              className="btn btn-primary btn-sm col-6"
              onClick={() => setSelected([...selected, original])}
            >
              -->
            </button>
            <div className="col-6">
              <input
                key={original.id}
                type="checkbox"
                style={{ width: "20px", height: "20px" }}
              />
            </div>
          </div>
        </>
      ),
      sortable: false
    }
  ];

  function onFilterSubmit(values, { setSubmitting }: FormikActions<any>) {
    setFilter({ rsql: rsql(values.filter) });
    setSubmitting(false);
  }

  return (
    <div>
      <Head title="Sample Selection" />
      <Nav />
      <div className="container-fluid">
        <strong>Filter records:</strong>
        <Formik initialValues={{ filter: null }} onSubmit={onFilterSubmit}>
          <Form className="form-group">
            <FilterBuilderField filterAttributes={["name"]} name="filter" />
            <button className="btn btn-primary" type="submit">
              Search
            </button>
          </Form>
        </Formik>
        <div className="row form-group">
          <div className="col-5">
            <strong>Available Samples</strong>
            <QueryTable
              columns={SAMPLE_COLUMNS}
              filter={filter}
              include="group"
              path="sample"
            />
          </div>
          <div className="col-2" style={{ marginTop: "100px" }}>
            <button className="btn btn-primary">--></button>
          </div>
          <div className="col-5">
            <strong>Selected Samples</strong>
            <ReactTable
              className="-striped"
              columns={[
                { accessor: "group.groupName", Header: "Group Name" },
                { accessor: "name", Header: "Name" },
                { accessor: "version", Header: "Version" },
                {
                  Cell: ({ index }) => (
                    <div>
                      <button
                        className="btn btn-dark"
                        onClick={() => {
                          const newSelected = [...selected];
                          newSelected.splice(index, 1);
                          setSelected(newSelected);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )
                }
              ]}
              data={selected}
              pageSize={selected.length}
              showPagination={false}
              sortable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
