import {
  ApiClientContext,
  ButtonBar,
  CancelButton,
  DeleteButton,
  ErrorViewer,
  LoadingSpinner,
  Query,
  safeSubmit,
  SubmitButton,
  TextField,
} from "common-ui";
import { Form, Formik, FormikContextType } from "formik";
import { useRouter, NextRouter } from "next/router";
import { CollectorGroup } from "../../types/objectstore-api/resources/CollectorGroup";
import { useContext } from "react";
import { Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

interface CollectorGroupFormProps {
  collectorGroup?: CollectorGroup;
  router: NextRouter;
}

export default function CollectorGroupEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();
  return (
    <div>
      <Head title={formatMessage("editCollectorGroupTitle")} />
      <Nav />
      <main className="container-fluid">
         <div>
           <h1>
             <DinaMessage id="addCollectorGroupTitle" />
           </h1>
           <CollectorGroupForm router={router} />
         </div>
      </main>
    </div>
  );
}

function CollectorGroupForm({
  collectorGroup,
  router
}: CollectorGroupFormProps) {
  const { save } = useContext(ApiClientContext);
  const { id } = router.query;
  const initialValues = collectorGroup || { type: "collector-group" };
  const { formatMessage } = useDinaIntl();

  const onSubmit = safeSubmit(
    async (
      submittedValues,
      { setStatus, setSubmitting }: FormikContextType<any>
    ) => {

      await save(
        [
          {
            resource: submittedValues,
            type: "collector-group"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      );
      await router.push(`/collector-group/list`);
    }
  );
  
  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      <Form translate={undefined}>
        <ErrorViewer />
        <ButtonBar>
          <SubmitButton />
          <CancelButton
            entityId={id as string}
            entityLink="/collector-group"
            byPassView={true}
          />
          <DeleteButton
            className="ml-5"
            id={id as string}
            options={{ apiBaseUrl: "/collection-api" }}
            postDeleteRedirect="/collector-group/list"
            type="collector-group"
          />
        </ButtonBar>
        <div>
          <div className="row">
            <TextField
              className="col-md-3 startEventDateTime"
              name="startEventDateTime"
              label={formatMessage("startEventDateTimeLabel")}
              placeholder={"YYYY-MM-DDTHH:MM:SS.MMM"}
            />
            <TextField
              className="col-md-3"
              name="verbatimEventDateTime"
              label={formatMessage("verbatimEventDateTimeLabel")}
            />
          </div> 
        </div>
      </Form>
    </Formik>
  );
}
