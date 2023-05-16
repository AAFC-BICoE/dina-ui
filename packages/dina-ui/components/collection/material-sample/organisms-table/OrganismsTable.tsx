import { ColumnDef, Row } from "@tanstack/react-table";
import classNames from "classnames";
import {
  FieldHeader,
  FormikButton,
  ReactTable8,
  useDinaFormContext
} from "common-ui";
import { useFormikContext } from "formik";
import { get, isEmpty, keys } from "lodash";
import { SortEnd } from "react-sortable-hoc";
import { OrganismStateField } from "../../../";
import { DinaMessage, useDinaIntl } from "../../../../intl/dina-ui-intl";
import { Organism } from "../../../../types/collection-api/resources/Organism";
import { ExpandedState } from "@tanstack/react-table";

export interface OrganismsTableProps {
  organismsQuantity: number;
  organisms: (Organism | null | undefined)[];
  namePrefix: string;
  onRemoveClick: (index: number) => void;
  onTargetChecked: (index: number) => void;
  onRowMove: (from: number, to: number) => void;
  useTargetOrganism: boolean;
}

export function OrganismsTable({
  organismsQuantity,
  organisms,
  namePrefix,
  onRemoveClick,
  onTargetChecked,
  onRowMove,
  useTargetOrganism
}: OrganismsTableProps) {
  const { formatMessage } = useDinaIntl();
  const { isTemplate, readOnly, initialValues } = useDinaFormContext();

  /** Number-to-boolean map for when only the first organism is expanded. */
  const expandFirstOnly = { 0: organismsQuantity === 1 };

  const initialExpanded: ExpandedState = readOnly ? true : expandFirstOnly;

  function handleRemoveClick(index: number) {
    onRemoveClick(index);
  }

  function onSortEnd(se: SortEnd) {
    onRowMove(se.oldIndex, se.newIndex);
  }

  const tableColumns: ColumnDef<Organism>[] = [
    {
      id: "rowExpendHandle",
      size: 60,
      cell: ({ row }) => <OrganismExpanderComponent row={row} />
    },
    {
      id: "determination",
      cell: ({ row }) => {
        const primaryDet = row.original?.determination?.find(
          (it) => it.isPrimary
        );
        const { scientificName, verbatimScientificName } = primaryDet ?? {};

        const cellText = verbatimScientificName || scientificName;
        return <span className="organism-determination-cell">{cellText}</span>;
      },
      header: () => <FieldHeader name="determinationPrimary" />
    },
    {
      id: "lifeStage",
      accessorKey: "lifeStage",
      header: () => <FieldHeader name="lifeStage" />
    },
    {
      id: "sex",
      accessorKey: "sex",
      header: () => <FieldHeader name="sex" />
    },
    {
      id: "actionCol",
      size: 250,
      cell: ({ row }) => (
        <>
          {!isTemplate && !readOnly && (
            <FormikButton
              className="btn btn-dark remove-organism-button"
              onClick={() => handleRemoveClick(row.index)}
            >
              <DinaMessage id="removeOrganism" />
            </FormikButton>
          )}
        </>
      )
    }
  ];

  if (useTargetOrganism) {
    const checkboxProps = {
      style: {
        display: "block",
        height: "20px",
        marginLeft: "15px",
        width: "20px"
      },
      type: "checkbox",
      readOnly: true
    };
    tableColumns.splice(1, 0, {
      id: "isTarget",
      header: formatMessage("isTargetHeader"),
      cell: ({ row }) => {
        const isTarget: boolean = row.original?.isTarget ?? false;
        const checkMark = <input {...checkboxProps} checked={isTarget} />;
        return <span className="organism-target-cell">{checkMark}</span>;
      }
    });
  }

  /** Only show up to the organismsQuantity number */
  const visibleTableData: Organism[] = [...new Array(organismsQuantity)].map(
    (_, index) => organisms[index] || { type: "organism", isTarget: false }
  );

  return (
    <ReactTable8
      columns={tableColumns}
      enableDnd={true}
      data={visibleTableData}
      getRowCanExpand={() => true}
      defaultExpanded={initialExpanded}
      renderSubComponent={({ row }) => (
        <div className="m-2">
          <OrganismStateField
            index={row.index}
            namePrefix={`${namePrefix}[${row.index}].`}
            individualEntry={true}
            useTargetOrganism={useTargetOrganism}
            onTargetChecked={onTargetChecked}
          />
        </div>
      )}
      className="-striped"
    />
  );
}

function OrganismExpanderComponent<TData>({ row }: { row: Row<TData> }) {
  const { errors } = useFormikContext();

  const prefix = `organism[${row.index}]`;

  const hasError =
    !isEmpty(get(errors, prefix)) ||
    keys(errors).some((key) => key.startsWith(prefix));

  return (
    <button
      className={classNames(
        "btn btn-light expand-organism",
        `${row.getIsExpanded() ? "is" : "not"}-expanded`
      )}
      style={{ backgroundColor: "inherit" }}
      type="button"
      onClick={() => row.getToggleExpandedHandler()()}
    >
      <div>
        <span
          className={`rt-expander ${row.getIsExpanded() ? "-open" : false}`}
        >
          •
        </span>
      </div>
      {hasError && (
        <div className="text-danger is-invalid">
          ({<DinaMessage id="hasError" />})
        </div>
      )}
    </button>
  );
}

function RowExpendHandle({ onExpandedChange }) {
  return (
    <button
      className="btn btn-light expand-organism is-expanded"
      style={{ pointerEvents: "none", backgroundColor: "inherit" }}
      type="button"
      onClick={onExpandedChange}
    >
      <div>
        <span className="rt-expander -open">•</span>
      </div>
    </button>
  );
}
