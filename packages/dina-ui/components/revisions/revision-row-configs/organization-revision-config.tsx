import { intlContext, useQuery } from "common-ui";
import _ from "lodash";
import Link from "next/link";
import { useContext } from "react";
import { Organization } from "../../../types/agent-api";
import { RevisionRowConfig } from "../revision-row-config";

import { AuditSnapshot } from "../../../types/objectstore-api";

export function LanguageBadge({ language }: { language?: string }) {
  const { locale } = useContext(intlContext);

  if (!language) return null;

  let displayName = language.toUpperCase();
  try {
    displayName =
      _.capitalize(
        new Intl.DisplayNames(locale, { type: "language" }).of(
          language.toLowerCase()
        )
      ) ?? language.toUpperCase();
  } catch {
    displayName = language.toUpperCase();
  }

  return <span className="badge ms-2">{displayName}</span>;
}

interface OrganizationNameItemProps {
  item: any;
  index: number;
}

function OrganizationNameItem({ item, index }: OrganizationNameItemProps) {
  // If the item already has name and languageCode
  if (item?.name && (item?.languageCode || item?.lang)) {
    return (
      <div className="pb-1" key={index}>
        <span>{item.name}</span>
        <LanguageBadge language={item.languageCode || item.lang} />
      </div>
    );
  }

  // If item is just a string
  if (typeof item === "string") {
    return (
      <div className="pb-1" key={index}>
        <span>{item}</span>
      </div>
    );
  }

  // If item is a JaVers ValueObjectId reference (fragment)
  if (item?.fragment && item?.ownerId) {
    return <OrganizationNameFragmentItem item={item} index={index} />;
  }

  // Fallback for object with name only or unknown structure
  if (item?.name) {
    return (
      <div className="pb-1" key={index}>
        <span>{item.name}</span>
      </div>
    );
  }

  return null;
}

function OrganizationNameFragmentItem({
  item,
  index
}: {
  item: any;
  index: number;
}) {
  const cdoId = item.ownerId?.cdoId || item.ownerId?.id;
  const fragment = item.fragment;
  const fragmentIndex = parseInt(
    fragment?.split("/")?.[1] ?? String(index),
    10
  );

  // Query snapshot for the fragment first
  const snapshotQuery = useQuery<AuditSnapshot[]>({
    path: "agent-api/audit-snapshot",
    filter: {
      instanceId: `organization/${cdoId}#${fragment}`
    }
  });

  // Query organization as fallback
  const orgQuery = useQuery<Organization>(
    {
      path: `agent-api/organization/${cdoId}`
    },
    { disabled: !cdoId }
  );

  const snapshotData = snapshotQuery?.response?.data;
  const snapshotState = Array.isArray(snapshotData)
    ? snapshotData[0]?.state
    : (snapshotData as any)?.state;

  if (snapshotState?.name) {
    return (
      <div className="pb-1">
        <span>{snapshotState.name}</span>
        <LanguageBadge
          language={snapshotState.languageCode || snapshotState.lang}
        />
      </div>
    );
  }

  const orgData = orgQuery?.response?.data;
  const orgNameObj = orgData?.names?.[fragmentIndex];

  if (orgNameObj?.name) {
    return (
      <div className="pb-1">
        <span>{orgNameObj.name}</span>
        <LanguageBadge language={orgNameObj.languageCode} />
      </div>
    );
  }

  return null;
}

export function OrganizationNamesViewer({ value }: { value: any }) {
  if (!value) return null;

  // If value is an array of names or references
  if (Array.isArray(value)) {
    return (
      <div>
        {value.map((item, index) => (
          <OrganizationNameItem key={index} item={item} index={index} />
        ))}
      </div>
    );
  }

  // If value is a dictionary { EN: "...", FR: "..." }
  if (typeof value === "object") {
    return (
      <div>
        {Object.entries(value).map(([lang, name], index) => (
          <div className="pb-1" key={index}>
            <span>{String(name)}</span>
            <LanguageBadge language={lang} />
          </div>
        ))}
      </div>
    );
  }

  return <div>{String(value)}</div>;
}

export const ORGANIZATION_REVISION_ROW_CONFIG: RevisionRowConfig<Organization> =
  {
    name: ({ id, names }) => (
      <Link href={`/organization/view?id=${id}`}>{names?.[0]?.name || id}</Link>
    ),
    customValueCells: {
      names: ({
        row: {
          original: { value }
        }
      }) => <OrganizationNamesViewer value={value} />
    }
  };
