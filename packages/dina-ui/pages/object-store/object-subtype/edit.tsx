import {
  BackButton,
  ButtonBar,
  DateField,
  DeleteButton,
  DinaForm,
  DinaFormOnSubmit,
  SelectField,
  SubmitButton,
  TextField,
  useQuery,
  withResponse,
  QueryState
} from "common-ui";
import { connect } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ObjectSubtype } from "../../../types/objectstore-api/resources/ObjectSubtype";

interface ObjectSubtypeFormProps {
  objectSubtype?: ObjectSubtype;
  router: NextRouter;
}

export function ObjectSubtypeEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();

  const title = id ? "editObjectSubtypeTitle" : "addObjectSubtypeTitle";

  const query = id
    ? useQuery<ObjectSubtype>({
        path: `objectstore-api/object-subtype/${id}`
      })
    : null;

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <DinaMessage id="editObjectSubtypeTitle" />
            </h1>
            {id ? (
              withResponse(
                query as QueryState<ObjectSubtype, undefined>,
                ({ data }) => (
                  <ObjectSubtypeForm objectSubtype={data} router={router} />
                )
              )
            ) : (
              <ObjectSubtypeForm router={router} />
            )}
          </div>
        ) : (
          <div>
            <h1>
              <DinaMessage id="addObjectSubtypeTitle" />
            </h1>
            <ObjectSubtypeForm router={router} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ObjectSubtypeForm({ objectSubtype, router }: ObjectSubtypeFormProps) {
  const { id } = router.query;
  const initialValues = objectSubtype || { type: "object-subtype" };

  const onSubmit: DinaFormOnSubmit = async ({
    submittedValues,
    api: { save }
  }) => {
    await save(
      [
        {
          resource: submittedValues,
          type: "object-subtype"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );

    await router.push(`/object-store/object-subtype/list`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar className="mb-3">
        <div className="col-md-6 col-sm-12 mt-2">
          <BackButton
            entityId={id as string}
            entityLink="/object-store/object-subtype"
            byPassView={true}
          />
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
          <CustomDeleteButton />
        </div>
      </ButtonBar>
      <div>
        <div className="row">
          <SelectField
            options={DC_TYPE_OPTIONS}
            name="dcType"
            className="col-sm-4"
          />
        </div>
        <div className="row">
          <TextField className="col-md-4" name="acSubtype" />
        </div>
        <div className="row">
          <DateField
            className="col-md-4"
            showTime={true}
            name="createdOn"
            disabled={true}
          />
          <TextField className="col-md-4" readOnly={true} name="createdBy" />
        </div>
      </div>
    </DinaForm>
  );
}

const CustomDeleteButton = connect<{}, ObjectSubtype>(
  ({ formik: { values: subType } }) => (
    <DeleteButton
      className="ms-3"
      id={subType.id}
      options={{ apiBaseUrl: "/objectstore-api" }}
      postDeleteRedirect="/object-store/object-subtype/list"
      type="object-subtype"
    />
  )
);

const DC_TYPE_OPTIONS = [
  {
    label: "Image",
    value: "IMAGE"
  },
  {
    label: "Moving Image",
    value: "MOVING_IMAGE"
  },
  {
    label: "Sound",
    value: "SOUND"
  },
  {
    label: "Text",
    value: "TEXT"
  },
  {
    label: "Dataset",
    value: "DATASET"
  },
  {
    label: "Undetermined",
    value: "UNDETERMINED"
  }
];

export default withRouter(ObjectSubtypeEditPage);
