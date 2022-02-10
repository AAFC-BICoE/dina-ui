import {
  FieldSet,
  FormikButton,
  NumberField,
  useDinaFormContext,
  useFieldLabels
} from "common-ui";
import { FieldArray } from "formik";
import { get } from "lodash";
import { useState } from "react";
import ReactTable, { Column } from "react-table";
import { OrganismStateField } from "..";
import { BulkEditTabWarning } from "../..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Organism } from "../../../types/collection-api/resources/Organism";
import { SortableContainer, SortableElement } from "react-sortable-hoc";

export interface OrganismsFieldProps {
  /** Organism array field name. */
  name: string;
  /** FieldSet id */
  id?: string;
}

export function OrganismsField({ name, id }: OrganismsFieldProps) {
  const { isTemplate } = useDinaFormContext();

  return (
    <FieldSet
      id={id}
      className="organisms-section"
      fieldName={name}
      legend={<DinaMessage id="organism" />}
    >
      <BulkEditTabWarning
        targetType="material-sample"
        fieldName={name}
        setDefaultValue={ctx => {
          // Auto-create the first organism:
          ctx.bulkEditFormRef?.current?.setFieldValue("organismsQuantity", 1);
          ctx.bulkEditFormRef?.current?.setFieldValue(name, [{}]);
        }}
      >
        <FieldArray name={name}>
          {({ form, remove }) => {
            const organismsQuantity =
              Number(form.values.organismsQuantity) || 1;
            const organisms: (Organism | null | undefined)[] =
              get(form.values, name) || [];

            function removeOrganism(index: number) {
              remove(index);
              form.setFieldValue("organismsQuantity", organismsQuantity - 1);
            }

            return (
              <div>
                {!isTemplate && (
                  <div className="row">
                    <NumberField
                      name="organismsQuantity"
                      className="col-sm-6"
                    />
                  </div>
                )}
                <OrganismsTable
                  namePrefix={name}
                  organisms={organisms}
                  organismsQuantity={organismsQuantity}
                  onRemoveClick={removeOrganism}
                />
              </div>
            );
          }}
        </FieldArray>
      </BulkEditTabWarning>
    </FieldSet>
  );
}

interface OrganismsTableProps {
  organismsQuantity: number;
  organisms: (Organism | null | undefined)[];
  namePrefix: string;
  onRemoveClick: (index: number) => void;
}

function OrganismsTable({
  organismsQuantity,
  organisms,
  namePrefix,
  onRemoveClick
}: OrganismsTableProps) {
  const { formatMessage } = useDinaIntl();
  const { getFieldLabel } = useFieldLabels();
  const { isTemplate, readOnly, initialValues } = useDinaFormContext();

  const initialLength = Number(get(initialValues, namePrefix)?.length) || 1;

  const allExpandedInitially = [...new Array(initialLength)].reduce<
    Record<number, boolean>
  >((prev, _, index) => ({ ...prev, [index]: true }), {});

  const initialExpanded: Record<number, boolean> = readOnly
    ? allExpandedInitially
    : { 0: organismsQuantity === 1 };

  const [expanded, setExpanded] = useState(initialExpanded);

  function handleRemoveClick(index: number) {
    setExpanded({});
    onRemoveClick(index);
  }

  function onExpandedChange(newExpanded: Record<number, boolean>) {
    // Disable expand change in template mode:
    if (isTemplate) {
      return;
    }
    setExpanded(newExpanded);
  }

  const tableColumns: Column<Organism>[] = [
    {
      id: "determination",
      accessor: o => {
        const primaryDet = o?.determination?.find(it => it.isPrimary);
        const { scientificName, verbatimScientificName } = primaryDet ?? {};

        const cellText = verbatimScientificName || scientificName;
        return cellText;
      },
      Header: formatMessage("determinationPrimary")
    },
    ...["lifeStage", "sex"].map<Column<Organism>>(accessor => ({
      accessor,
      Header: getFieldLabel({ name: accessor }).fieldLabel
    })),
    {
      Header: "",
      Cell: ({ index }) => (
        <>
          {!isTemplate && !readOnly && (
            <FormikButton
              className="btn btn-dark"
              onClick={() => handleRemoveClick(index)}
            >
              <DinaMessage id="removeOrganism" />
            </FormikButton>
          )}
        </>
      )
    }
  ];

  /** Only show up to the organismsQuantity number */
  const visibleTableData: Organism[] = [...new Array(organismsQuantity)].map(
    (_, index) => organisms[index] || { type: "organism" }
  );

  return (
    <ReactTable
      columns={tableColumns}
      data={visibleTableData}
      sortable={false}
      minRows={organismsQuantity}
      expanded={expanded}
      // TbodyComponent={TbodyComponent}
      onExpandedChange={onExpandedChange}
      SubComponent={row => {
        const isOdd = (row.index + 1) % 2 === 1;

        // Add zebra striping to the subcomponent background:
        const backgroundColor = isOdd ? "rgba(0,0,0,0.03)" : undefined;

        return (
          <div style={{ backgroundColor }}>
            <OrganismStateField namePrefix={`${namePrefix}[${row.index}].`} />
          </div>
        );
      }}
      className="-striped"
    />
  );
}

// function TbodyComponent(props) {
//   return <SortableTBody axis="y" {...props} />;
// }

// const SortableTBody = SortableContainer(({ children, ...bodyProps }) => {
//   const [rows, otherChildren] = children;

//   return (
//     <div {...bodyProps} className="rt-tbody">
//       {rows.map((row, index) => (
//         <SortableTRow {...row.props} index={index} />
//       ))}
//       {otherChildren}
//     </div>
//   );
// });

// const SortableTRow = SortableElement(({ children }) => <>{children}</>);
