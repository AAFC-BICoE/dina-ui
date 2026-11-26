import { useFormikContext } from "formik";
import Link from "next/link";
import { Fragment, ReactNode } from "react";
import {
  FaExchangeAlt,
  FaFolder,
  FaLayerGroup,
  FaLongArrowAltDown,
  FaLongArrowAltUp,
  FaTags
} from "react-icons/fa";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";

export interface SummaryRowProps {
  icon: ReactNode;
  label: ReactNode;
  count?: number;
  children: ReactNode;
}

/** Label column (icon, label, optional count) beside its content. */
export function SummaryRow({ icon, label, count, children }: SummaryRowProps) {
  return (
    <div
      className="list-group-item d-flex flex-wrap align-items-center gap-2"
      style={{ paddingTop: "0.625rem", paddingBottom: "0.625rem" }}
    >
      <div
        className="fw-bold d-flex align-items-center gap-2"
        style={{ width: "14rem", minHeight: "1.875rem" }}
      >
        <span className="d-flex" style={{ color: "#335075" }}>
          {icon}
        </span>
        {label}
        {count !== undefined && (
          <span className="text-muted fw-normal">{count}</span>
        )}
      </div>
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}

function LinkList({ items, path }: { items: any[]; path: string }) {
  return (
    <>
      {items.map((item, idx) => (
        <Fragment key={item.id}>
          {idx > 0 && ", "}
          <Link href={`${path}${item.id}`}>{item.name ?? item.id}</Link>
        </Fragment>
      ))}
    </>
  );
}

export interface MaterialSampleSummaryListProps {
  /** Elastic search query for the most recent transaction of this sample. */
  transactionElasticQuery: any;
}

/** Projects, assemblages, tags and latest transaction as rows. Empty rows are hidden. */
export function MaterialSampleSummaryList({
  transactionElasticQuery
}: MaterialSampleSummaryListProps) {
  const { values } = useFormikContext<MaterialSample>();
  const projects = values.projects ?? [];
  const assemblages = values.assemblages ?? [];
  const tags = values.tags ?? [];
  const transactionHits = transactionElasticQuery?.response?.data?.hits;
  const transaction = transactionHits?.hits?.[0]?._source?.data;

  if (!projects.length && !assemblages.length && !tags.length && !transaction) {
    return null;
  }

  return (
    <div className="list-group mb-3 material-sample-summary-list">
      {!!projects.length && (
        <SummaryRow
          icon={<FaFolder />}
          label={<DinaMessage id="projects" />}
          count={projects.length}
        >
          <LinkList items={projects} path="/collection/project/view?id=" />
        </SummaryRow>
      )}
      {!!assemblages.length && (
        <SummaryRow
          icon={<FaLayerGroup />}
          label={<DinaMessage id="assemblages" />}
          count={assemblages.length}
        >
          <LinkList
            items={assemblages}
            path="/collection/assemblage/view?id="
          />
        </SummaryRow>
      )}
      {!!tags.length && (
        <SummaryRow
          icon={<FaTags />}
          label={<DinaMessage id="tags" />}
          count={tags.length}
        >
          <div className="d-flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="badge rounded-pill bg-light text-dark border fw-normal fs-6"
              >
                {tag}
              </span>
            ))}
          </div>
        </SummaryRow>
      )}
      {transaction && (
        <SummaryRow
          icon={<FaExchangeAlt />}
          label={<DinaMessage id="transactions" />}
          count={transactionHits?.total?.value}
        >
          {/* Only the most recent transaction; the Transactions section lists them all. */}
          {transaction.attributes?.materialDirection === "OUT" ? (
            <FaLongArrowAltUp className="me-1" />
          ) : (
            <FaLongArrowAltDown className="me-1" />
          )}
          <Link
            href={`/loan-transaction/transaction/view?id=${transaction.id}`}
          >
            {transaction.attributes?.transactionNumber ?? transaction.id}
          </Link>
        </SummaryRow>
      )}
    </div>
  );
}
