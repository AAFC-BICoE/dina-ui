import {
  BackButton,
  DateField,
  DeleteButton,
  DinaForm,
  DinaFormOnSubmit,
  MultilingualDescription,
  MultilingualTitle,
  RefSubmitButton,
  SelectField,
  TextField,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { FormikProps } from "formik";
import _ from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { RefObject, useRef } from "react";
import PageLayout from "../../../components/page/PageLayout";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { ObjectSubtype } from "../../../types/objectstore-api/resources/ObjectSubtype";

interface ObjectSubtypeFormProps {
  objectSubtype?: ObjectSubtype;
  router: NextRouter;
  formRef: RefObject<FormikProps<any> | null>;
}

export function ObjectSubtypeEditPage({ router }: WithRouterProps) {
  const id = router.query.id?.toString();
  const formRef = useRef<FormikProps<any>>(null);

  const title = id ? "editObjectSubtypeTitle" : "addObjectSubtypeTitle";

  const query = useQuery<ObjectSubtype>(
    {
      path: `objectstore-api/object-subtype/${id}`
    },
    {
      disabled: !id,
      // System defined subtypes can't be edited, send direct URL visits back to the view page:
      onSuccess: async ({ data }) => {
        if (data.systemDefined) {
          await router.replace(`/object-store/object-subtype/view?id=${id}`);
        }
      }
    }
  );

  const buttonBarContent = (
    <>
      <div className="col-md-6 col-sm-12 mt-2">
        <BackButton entityId={id} entityLink="/object-store/object-subtype" />
      </div>
      <div className="col-md-6 col-sm-12 d-flex">
        <RefSubmitButton formRef={formRef} className="ms-auto" />
        {id && (
          <DeleteButton
            className="ms-3"
            id={id}
            options={{ apiBaseUrl: "/objectstore-api" }}
            postDeleteRedirect="/object-store/object-subtype/list"
            type="object-subtype"
          />
        )}
      </div>
    </>
  );

  return (
    <PageLayout titleId={title} buttonBarContent={buttonBarContent}>
      {id ? (
        withResponse(query, ({ data }) =>
          data.systemDefined ? null : (
            <ObjectSubtypeForm
              objectSubtype={data}
              router={router}
              formRef={formRef}
            />
          )
        )
      ) : (
        <ObjectSubtypeForm router={router} formRef={formRef} />
      )}
    </PageLayout>
  );
}

/** Converts the multilingual fields to the editable Dictionary format. */
export function objectSubtypeToFormData(objectSubtype?: ObjectSubtype): any {
  if (!objectSubtype) {
    return { type: "object-subtype" };
  }
  return {
    ...objectSubtype,
    multilingualTitle: _.fromPairs(
      objectSubtype.multilingualTitle?.titles?.map(({ lang, title }) => [
        lang ?? "",
        title ?? ""
      ])
    ),
    multilingualDescription: _.fromPairs(
      objectSubtype.multilingualDescription?.descriptions?.map(
        ({ lang, desc }) => [lang ?? "", desc ?? ""]
      )
    )
  };
}

function ObjectSubtypeForm({
  objectSubtype,
  router,
  formRef
}: ObjectSubtypeFormProps) {
  const onSubmit: DinaFormOnSubmit = async ({
    submittedValues,
    api: { save }
  }) => {
    // Convert the editable Dictionary format back to the stored format, skipping blank entries:
    const titles = _.toPairs<string>(submittedValues.multilingualTitle)
      .filter(([, title]) => title?.trim())
      .map(([lang, title]) => ({ lang, title }));
    const descriptions = _.toPairs<string>(
      submittedValues.multilingualDescription
    )
      .filter(([, desc]) => desc?.trim())
      .map(([lang, desc]) => ({ lang, desc }));

    const [saved] = await save<ObjectSubtype>(
      [
        {
          resource: {
            ...submittedValues,
            multilingualTitle: titles.length ? { titles } : null,
            multilingualDescription: descriptions.length
              ? { descriptions }
              : null
          },
          type: "object-subtype"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );

    await router.push(`/object-store/object-subtype/view?id=${saved.id}`);
  };

  return (
    <DinaForm
      initialValues={objectSubtypeToFormData(objectSubtype)}
      onSubmit={onSubmit}
      innerRef={formRef}
    >
      <ObjectSubtypeFormLayout />
    </DinaForm>
  );
}

export function ObjectSubtypeFormLayout() {
  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <div className="row">
        <SelectField
          options={DC_TYPE_OPTIONS}
          name="dcType"
          className="col-md-6"
          requiredField={true}
        />
        <TextField
          className="col-md-6"
          name="acSubtype"
          label={formatMessage("objectSubtypeName")}
          requiredField={true}
        />
      </div>
      <MultilingualTitle />
      <MultilingualDescription />
      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" showTime={true} name="createdOn" />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </div>
  );
}

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
