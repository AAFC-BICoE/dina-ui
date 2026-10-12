import { Children, isValidElement, ReactNode } from "react";
import { useDinaFormContext } from "common-ui";
import { CollectingEvent } from "../../../types/collection-api/resources/CollectingEvent";
import { PersonSelectField } from "../../resource-select-fields/resource-select-fields";

interface SummaryRowProps {
  label: string;
  value?: ReactNode;
}

function hasValue(value: ReactNode) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    (!Array.isArray(value) || value.length > 0)
  );
}

function SummaryRow({ label, value }: SummaryRowProps) {
  if (!hasValue(value)) {
    return null;
  }

  return (
    <div className="row py-1">
      <div className="col-md-3 fw-semibold">{label}</div>
      <div className="col-md-9">{value}</div>
    </div>
  );
}

interface SummarySectionProps {
  title: string;
  children: ReactNode;
}

function SummarySection({ title, children }: SummarySectionProps) {
  const hasRows = Children.toArray(children).some(
    (child) =>
      isValidElement<SummaryRowProps>(child) && hasValue(child.props.value)
  );
  if (!hasRows) {
    return null;
  }

  return (
    <section className="mb-4">
      <h3
        className="border-bottom pb-2 mb-2"
        style={{
          fontSize: "0.95rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#274c77"
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function formatTimeRange(
  start?: string | null,
  end?: string | null
): string | undefined {
  const getTime = (value?: string | null) => {
    if (!value) return undefined;

    const match = value.match(/T(\d{2}:\d{2})/);
    return match?.[1];
  };

  const startTime = getTime(start);
  const endTime = getTime(end);

  if (startTime && endTime) return `${startTime}–${endTime}`;
  return startTime ?? endTime;
}

function formatRange(
  minimum?: number,
  maximum?: number,
  unit?: string
): string | undefined {
  if (minimum != null && maximum != null) {
    return `${minimum}–${maximum}${unit ? ` ${unit}` : ""}`;
  }

  if (minimum != null) {
    return `${minimum}${unit ? ` ${unit}` : ""}`;
  }

  if (maximum != null) {
    return `${maximum}${unit ? ` ${unit}` : ""}`;
  }

  return undefined;
}

export function CollectingEventSummary() {
  const { initialValues } = useDinaFormContext();
  const collectingEvent = initialValues as CollectingEvent;

  const primaryGeoreference =
    collectingEvent.geoReferenceAssertions?.find(
      (assertion) => assertion.isPrimary
    ) ?? collectingEvent.geoReferenceAssertions?.[0];

  const coordinates =
    primaryGeoreference?.dwcDecimalLatitude != null &&
    primaryGeoreference?.dwcDecimalLongitude != null
      ? `${primaryGeoreference.dwcDecimalLatitude}, ${primaryGeoreference.dwcDecimalLongitude}`
      : undefined;

  const depth = formatRange(
    collectingEvent.dwcMinimumDepthInMeters,
    collectingEvent.dwcMaximumDepthInMeters,
    "m"
  );

  const elevation = formatRange(
    collectingEvent.dwcMinimumElevationInMeters,
    collectingEvent.dwcMaximumElevationInMeters,
    "m"
  );

  const time = formatTimeRange(
    collectingEvent.startEventDateTime,
    collectingEvent.endEventDateTime
  );

  const site = collectingEvent.site
    ? collectingEvent.site.code
      ? `${collectingEvent.site.name} (${collectingEvent.site.code})`
      : collectingEvent.site.name
    : undefined;

  return (
    <div className="px-3 pt-1">
      <SummarySection title="Identifiers">
        <SummaryRow
          label="Collection Number"
          value={collectingEvent.dwcFieldNumber}
        />
        <SummaryRow
          label="Additional Numbers"
          value={collectingEvent.otherRecordNumbers?.join(", ")}
        />
      </SummarySection>

      <SummarySection title="Collecting">
        <SummaryRow
          label="Date"
          value={
            collectingEvent.verbatimEventDateTime ??
            collectingEvent.startEventDateTime?.split("T")[0]
          }
        />
        <SummaryRow label="Time" value={time} />
        <SummaryRow
          label="Verbatim Collectors"
          value={collectingEvent.dwcRecordedBy}
        />
        <SummaryRow
          label="Collectors"
          value={
            collectingEvent.collectors?.length ? (
              <PersonSelectField
                name="collectors"
                isMulti={true}
                removeLabel={true}
                removeBottomMargin={true}
              />
            ) : undefined
          }
        />
        <SummaryRow
          label="Collector's Number"
          value={collectingEvent.dwcRecordNumber}
        />
        <SummaryRow
          label="Collection Method"
          value={collectingEvent.collectionMethod?.name}
        />
        <SummaryRow
          label="Expedition"
          value={collectingEvent.expedition?.name}
        />
        <SummaryRow label="Site" value={site} />
      </SummarySection>

      <SummarySection title="Location">
        <SummaryRow
          label="Verbatim Locality"
          value={collectingEvent.dwcVerbatimLocality}
        />
        <SummaryRow label="Country" value={collectingEvent.dwcCountry} />
        <SummaryRow
          label="State / Province"
          value={collectingEvent.dwcStateProvince}
        />
        <SummaryRow
          label="Municipality"
          value={collectingEvent.dwcMunicipality}
        />
        <SummaryRow label="Coordinates" value={coordinates} />
        <SummaryRow label="Depth" value={depth} />
        <SummaryRow label="Elevation" value={elevation} />
      </SummarySection>

      <SummarySection title="Additional Details">
        <SummaryRow label="Habitat" value={collectingEvent.habitat} />
        <SummaryRow label="Host" value={collectingEvent.host} />
        <SummaryRow label="Substrate" value={collectingEvent.substrate} />
        <SummaryRow label="Protocol" value={collectingEvent.protocol?.name} />
        <SummaryRow label="Remarks" value={collectingEvent.remarks} />
      </SummarySection>
    </div>
  );
}
