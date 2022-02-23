import classNames from "classnames";
import {
  FieldSet,
  FormikButton,
  NumberField,
  ToggleField,
  useDinaFormContext,
  useFieldLabels
} from "common-ui";
import { FieldArray, useFormikContext } from "formik";
import { get, isEmpty, keys } from "lodash";
import { useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import {
  SortableContainer,
  SortableElement,
  SortableHandle,
  SortEnd
} from "react-sortable-hoc";
import ReactTable, { Column } from "react-table";
import { BulkEditTabWarning, OrganismStateField } from "../..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Organism } from "../../../types/collection-api/resources/Organism";

export interface OrganismsFieldProps {
  /** Organism array field name. */
  name: string;
  /** FieldSet id */
  id?: string;
}

export function OrganismsField({ name, id }: OrganismsFieldProps) {
  const { isTemplate, readOnly } = useDinaFormContext();

  return (
    <FieldSet
      id={id}
      className="organisms-section"
      fieldName={name}
      legend={<DinaMessage id="organisms" />}
    >
      <BulkEditTabWarning
        targetType="material-sample"
        fieldName={name}
        setDefaultValue={ctx => {
          // Auto-create the first organism:
          ctx.bulkEditFormRef?.current?.setFieldValue("organismsQuantity", 1);
          ctx.bulkEditFormRef?.current?.setFieldValue(name, [{}]);
        }}
        // Each Organism can only be attached to one Sample, so never show the Same Values warning,
        // because the bulk edited samples' Organisms should never be the same.
        showWarningWhenValuesAreTheSame={true}
      >
        <FieldArray name={name}>
          {({ form, remove, move }) => {
            const organisms: (Organism | null | undefined)[] =
              get(form.values, name) || [];

            const organismsQuantity = readOnly
              ? organisms.length
              : isTemplate
              ? 1
              : Number(form.values.organismsQuantity ?? 0);
            const organismsIndividualEntry = !!(
              form.values.organismsIndividualEntry ?? false
            );

            function removeOrganism(index: number) {
              remove(index);
              form.setFieldValue("organismsQuantity", organismsQuantity - 1);
            }

            return (
              <div>
                {!isTemplate && (
                  <div className="row">
                    <div className="col-md-6 d-flex gap-3">
                      <NumberField
                        name="organismsQuantity"
                        className="flex-grow-1"
                        inputProps={{ type: "number" }}
                        min={0}
                      />
                      {!readOnly && (
                        <ToggleField name="organismsIndividualEntry" />
                      )}
                    </div>
                  </div>
                )}
                {organismsQuantity > 0 &&
                  (organismsIndividualEntry ? (
                    <OrganismsTable
                      namePrefix={name}
                      organisms={organisms}
                      organismsQuantity={organismsQuantity}
                      onRemoveClick={removeOrganism}
                      onRowMove={move}
                    />
                  ) : (
                    <OrganismStateField namePrefix={`${name}[0].`} />
                  ))}
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
  onRowMove: (from: number, to: number) => void;
}

function OrganismsTable({
  organismsQuantity,
  organisms,
  namePrefix,
  onRemoveClick,
  onRowMove
}: OrganismsTableProps) {
  const { formatMessage } = useDinaIntl();
  const { getFieldLabel } = useFieldLabels();
  const { isTemplate, readOnly, initialValues } = useDinaFormContext();

  const initialLength = Number(get(initialValues, namePrefix)?.length) || 1;

  /** Number-to-boolean map for when all organisms are expanded. */
  const expandAll = [...new Array(initialLength)].reduce<
    Record<number, boolean>
  >((prev, _, index) => ({ ...prev, [index]: true }), {});

  /** Number-to-boolean map for when only the first organism is expanded. */
  const expandFirstOnly = { 0: organismsQuantity === 1 };

  const initialExpanded: Record<number, boolean> = readOnly
    ? expandAll
    : expandFirstOnly;

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

  function onSortStart(_, event: unknown) {
    setExpanded({});
    if (event instanceof MouseEvent) {
      document.body.style.cursor = "grabbing";
    }
  }

  function onSortEnd(se: SortEnd) {
    document.body.style.cursor = "inherit";
    onRowMove(se.oldIndex, se.newIndex);
  }

  const tableColumns: Column<Organism>[] = [
    ...(readOnly
      ? []
      : [
          {
            Header: "",
            Cell: () => <RowSortHandle />,
            width: 60
          }
        ]),
    {
      id: "determination",
      Cell: ({ original: o }) => {
        const primaryDet = o?.determination?.find(it => it.isPrimary);
        const { scientificName, verbatimScientificName } = primaryDet ?? {};

        const cellText = verbatimScientificName || scientificName;
        return <span className="organism-determination-cell">{cellText}</span>;
      },
      Header: formatMessage("determinationPrimary")
    },
    ...["lifeStage", "sex"].map<Column<Organism>>(accessor => ({
      accessor,
      className: `${accessor}-cell`,
      Header: getFieldLabel({ name: accessor }).fieldLabel
    })),
    {
      Header: "",
      Cell: ({ index }) => (
        <>
          {!isTemplate && !readOnly && (
            <FormikButton
              className="btn btn-dark remove-organism-button"
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
    <>
      <style>{`
        .rt-expandable, .rt-th:first-child {
          min-width: 4rem !important;
        }
      `}</style>
      <ReactTable
        columns={tableColumns}
        data={visibleTableData}
        sortable={false}
        minRows={organismsQuantity}
        pageSize={organismsQuantity || 1}
        ExpanderComponent={OrganismExpanderComponent}
        expanded={expanded}
        TbodyComponent={TbodyComponent}
        getTbodyProps={() => ({ onSortStart, onSortEnd })}
        onExpandedChange={onExpandedChange}
        showPagination={false}
        SubComponent={row => {
          const isOdd = (row.index + 1) % 2 === 1;

          // Add zebra striping to the subcomponent background:
          const backgroundColor = isOdd ? "rgba(0,0,0,0.03)" : undefined;

          return (
            <div className={isOdd ? "-odd" : ""} style={{ backgroundColor }}>
              <div className="p-3">
                <OrganismStateField
                  namePrefix={`${namePrefix}[${row.index}].`}
                />
              </div>
            </div>
          );
        }}
        className="-striped"
      />
    </>
  );
}

function OrganismExpanderComponent({ isExpanded, index }) {
  const { errors } = useFormikContext();

  const prefix = `organism[${index}]`;

  const hasError =
    !isEmpty(get(errors, prefix)) ||
    keys(errors).some(key => key.startsWith(prefix));

  return (
    <button
      className={classNames(
        "btn btn-light expand-organism",
        `${isExpanded ? "is" : "not"}-expanded`
      )}
      style={{ pointerEvents: "none", backgroundColor: "inherit" }}
      type="button"
    >
      <div>
        <span className={`rt-expander ${isExpanded ? "-open" : false}`}>•</span>
      </div>
      {hasError && (
        <div className="text-danger is-invalid">
          ({<DinaMessage id="hasError" />})
        </div>
      )}
    </button>
  );
}

function TbodyComponent(props) {
  return (
    <SortableTBody
      onSortStart={props.onSortStart}
      onSortEnd={props.onSortEnd}
      helperClass="d-flex"
      useDragHandle={true}
      axis="y"
      {...props}
    />
  );
}

const SortableTBody = SortableContainer(({ children, ...bodyProps }) => {
  const [rows, otherChildren] = children;
  const { readOnly } = useDinaFormContext();

  return (
    <div {...bodyProps} className="rt-tbody">
      {rows.map((row, index) => (
        <SortableTRow
          key={row.key}
          {...row.props}
          disabled={readOnly}
          index={index}
        />
      ))}
      {otherChildren}
    </div>
  );
});

const SortableTRow = SortableElement(({ children }) => <>{children}</>);

const RowSortHandle = SortableHandle(() => (
  <GiHamburgerMenu cursor="grab" size="2.5em" />
));
