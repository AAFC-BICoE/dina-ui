import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  filterBy,
  ResourceSelectField,
  SubmitButton,
  TextField,
  useQuery,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { GroupSelectField, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { ThermocyclerProfile } from "../../../types/seqdb-api/resources/ThermocyclerProfile";
import { Region } from "../../../types/seqdb-api/resources/Region";
import { useState } from "react";
import { FormikContextType, useFormikContext } from "formik";
import { useIntl } from "react-intl";
import { FaPlus, FaMinus } from "react-icons/fa";
import { FieldArray } from "formik";

interface ThermocyclerProfileFormProps {
  thermocyclerProfile?: ThermocyclerProfile;
  router: NextRouter;
}

export function ThermocyclerProfileEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();
  const title = id
    ? "editThermocyclerProfileTitle"
    : "addThermocyclerProfileTitle";

  const query = useQuery<ThermocyclerProfile>({
    include: "region",
    path: `seqdb-api/thermocycler-profile/${id}`
  });

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="editThermocyclerProfileTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <ThermocyclerProfileForm
                thermocyclerProfile={data}
                router={router}
              />
            ))}
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="addThermocyclerProfileTitle" />
            </h1>
            <ThermocyclerProfileForm router={router} />
          </div>
        )}
      </main>
    </div>
  );
}

function ThermocyclerProfileForm({
  thermocyclerProfile,
  router
}: ThermocyclerProfileFormProps) {
  const { id } = router.query;
  const initialValues = thermocyclerProfile || {
    type: "thermocycler-profile",
    steps: [""]
  };
  const onSubmit: DinaFormOnSubmit = async ({
    api: { save },
    submittedValues
  }) => {
    submittedValues.steps = submittedValues.steps.map((value) => value.step);
    const response = await save(
      [
        {
          resource: submittedValues,
          type: "thermocycler-profile"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    const newId = response[0].id;
    await router.push(`/seqdb/thermocycler-profile/view?id=${newId}`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        <BackButton
          entityId={id as string}
          entityLink="/seqdb/thermocycler-profile"
        />
      </ButtonBar>
      <SubmitButton className="ms-auto" />
      <ThermocyclerProfileFormFields />
    </DinaForm>
  );
}
export interface StepRowProps {
  showPlusIcon?: boolean;
  name: string;
  index: number;
  addRow?: () => void;
  removeRow?: (index) => void;
}

export function getFieldName(
  fieldArrayName: string,
  fieldName: string,
  index: number
) {
  return `${fieldArrayName}[${index}].${fieldName}`;
}

export function StepRow({
  index,
  addRow,
  removeRow,
  name,
  showPlusIcon
}: StepRowProps) {
  const textFieldName = getFieldName(name, "step", index);
  return (
    <div className="d-flex">
      <TextField name={textFieldName} customName={`Step${index + 1}`} />
      {index === 0 && showPlusIcon ? (
        <>
          {
            <FaPlus
              className="my-auto"
              onClick={addRow as any}
              size="2em"
              style={{ cursor: "pointer" }}
              name={getFieldName(name, "addRow", index)}
            />
          }
        </>
      ) : (
        <FaMinus
          className="my-auto"
          onClick={() => removeRow?.(index)}
          size="2em"
          style={{ cursor: "pointer" }}
          name={getFieldName(name, "removeRow", index)}
        />
      )}
    </div>
  );
}
export function ThermocyclerProfileFormFields() {
  const formik = useFormikContext<ThermocyclerProfile>();
  return (
    <div>
      <div className="row">
        <GroupSelectField
          className="col-md-2"
          name="group"
          enableStoredDefaultGroup={true}
        />
      </div>
      <div className="row">
        <ResourceSelectField<Region>
          className="col-md-2"
          name="region"
          filter={filterBy(["name"])}
          label="Gene Region"
          model="seqdb-api/region"
          optionLabel={(region) => region.name}
        />
        <TextField
          className="col-md-2"
          name="name"
          label="Thermocycler Profile Name"
        />
        <TextField className="col-md-2" name="application" />
        <TextField className="col-md-2" name="cycles" />
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="card-group row" style={{ padding: 15 }}>
            <FieldArray name="steps">
              {(fieldArrayProps) => {
                const elements: [] = fieldArrayProps.form.values.steps;

                function addRow() {
                  fieldArrayProps.push(
                    <StepRow
                      name={fieldArrayProps.name}
                      index={elements?.length ?? 0}
                      removeRow={removeRow}
                      addRow={addRow}
                    />
                  );
                }

                function removeRow(index) {
                  fieldArrayProps.remove(index);
                }

                const showPlusIcon = elements.length < 15;

                return elements?.length > 0
                  ? elements?.map((_, index) => {
                      return (
                        <StepRow
                          showPlusIcon={showPlusIcon}
                          name={fieldArrayProps.name}
                          key={index}
                          index={index}
                          addRow={addRow}
                          removeRow={removeRow}
                        />
                      );
                    })
                  : null;
              }}
            </FieldArray>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouter(ThermocyclerProfileEditPage);
