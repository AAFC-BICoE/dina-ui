import { useDinaFormContext } from "common-ui";
import { FaBan, FaExclamationTriangle } from "react-icons/fa";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

/** Biosafety extension keys in restrictionFieldsExtension, with their label message keys. */
const BIOSAFETY_LEVELS = [
  ["phac_animal_rg", "phacAnimalRGLevel"],
  ["phac_human_rg", "phacHumanRGLevel"],
  ["cfia_ppc", "cfiaPPCLevel"],
  ["phac_cl", "phacContainmentLevel"]
] as const;

/** Restriction remarks and biosafety levels in one alert box. Renders nothing when there are none. */
export function MaterialSampleRestrictionsAlert() {
  const { formatMessage } = useDinaIntl();
  const { initialValues } = useDinaFormContext();
  const { restrictionFieldsExtension, restrictionRemarks } =
    initialValues ?? {};

  const levels = BIOSAFETY_LEVELS.flatMap(([key, labelKey]) => {
    // Each extension stores one field, e.g. { risk_group: "Risk Group 2 (RG2)" }.
    const value = Object.values(restrictionFieldsExtension?.[key] ?? {})[0];
    return value
      ? [
          {
            label: formatMessage(labelKey).trim(),
            // Show the short code in brackets ("RG2"), or the whole value if there is none.
            value: String(value).match(/\(([^)]+)\)$/)?.[1] ?? String(value)
          }
        ]
      : [];
  });

  if (!restrictionRemarks && !levels.length) {
    return null;
  }

  return (
    <div
      className="mb-3 material-sample-restrictions-alert"
      role="alert"
      style={{
        display: "grid",
        gridTemplateColumns: "180px minmax(0, 1fr)",
        gap: "4px 16px",
        background: "#f8d7da",
        border: "1px solid #f1aeb5",
        color: "#58151c",
        borderRadius: ".375rem",
        padding: "10px 16px",
        fontSize: "15px"
      }}
    >
      <div className="fw-bold d-flex align-items-center" style={{ gap: 8 }}>
        <FaBan />
        <DinaMessage id="restrictions" />
      </div>
      <div
        className="d-flex flex-column"
        style={{ gap: 4, overflowWrap: "anywhere" }}
      >
        {restrictionRemarks && <div>{restrictionRemarks}</div>}
        {levels.map(({ label, value }) => (
          <div key={label}>
            <FaExclamationTriangle className="me-1" />
            {/* Nudge only the text down; the icon stays put. */}
            <span style={{ position: "relative", top: "2px" }}>
              <strong>{label}</strong> {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
