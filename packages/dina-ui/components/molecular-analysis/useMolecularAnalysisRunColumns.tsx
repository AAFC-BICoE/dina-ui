import { ChangeEvent, Dispatch, SetStateAction } from "react";
import {
  DeleteArgs,
  FieldHeader,
  SaveArgs,
  SettingsButton,
  useAccount,
  useApiClient,
  useStringComparator
} from "common-ui";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { MolecularAnalysisRunItem } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { AddAttachmentsButton } from "../object-store";
import { MolecularAnalysisResult } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisResult";
import { Metadata } from "packages/dina-ui/types/objectstore-api";
import React from "react";
import { SequencingRunItem } from "./useMolecularAnalysisRun";

interface UseMolecularAnalysisRunColumnsProps {
  type: string;
  setMolecularAnalysisRunItemNames?: Dispatch<
    SetStateAction<Record<string, string>>
  >;
  readOnly?: boolean;
  setReloadGenericMolecularAnalysisRun?: Dispatch<SetStateAction<number>>;
}

export function useMolecularAnalysisRunColumns({
  type,
  setMolecularAnalysisRunItemNames,
  readOnly,
  setReloadGenericMolecularAnalysisRun
}: UseMolecularAnalysisRunColumnsProps) {
  const { compareByStringAndNumber } = useStringComparator();
  const { save } = useApiClient();
  const { groupNames } = useAccount();

  // Table columns to display for the sequencing run.
  const SEQ_REACTION_COLUMNS: ColumnDef<SequencingRunItem>[] = [
    {
      id: "materialSampleName",
      cell: ({ row: { original } }) => {
        const materialSampleName =
          original?.materialSampleSummary?.materialSampleName;
        return (
          <>
            <Link
              href={`/collection/material-sample/view?id=${original.materialSampleId}`}
            >
              {materialSampleName || original.materialSampleId}
            </Link>
            {" ("}
            {original?.seqReaction?.seqPrimer?.name}
            {")"}
          </>
        );
      },
      header: () => <FieldHeader name="materialSampleName" />,
      accessorKey: "materialSampleSummary.materialSampleName",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.materialSampleSummary?.materialSampleName,
          b?.original?.materialSampleSummary?.materialSampleName
        ),
      enableSorting: true
    },
    {
      id: "molecularAnalysisRunItem.name",
      cell: ({ row: { original } }) => {
        return readOnly ? (
          <>{original.molecularAnalysisRunItem?.name}</>
        ) : (
          <input
            type="text"
            className="w-100 form-control"
            defaultValue={original.molecularAnalysisRunItem?.name}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setMolecularAnalysisRunItemNames?.(
                handleMolecularAnalysisRunItemNames(original, event)
              );
            }}
          />
        );
      },
      header: () => <DinaMessage id="molecularAnalysisRunItemName" />,
      accessorKey: "molecularAnalysisRunItem.name",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.materialSampleSummary?.materialSampleName,
          b?.original?.materialSampleSummary?.materialSampleName
        ),
      enableSorting: true
    },
    {
      id: "wellCoordinates",
      cell: ({ row }) => {
        return (
          <>
            {!row.original?.storageUnitUsage ||
            row.original?.storageUnitUsage?.wellRow === null ||
            row.original?.storageUnitUsage?.wellColumn === null
              ? ""
              : `${row.original.storageUnitUsage?.wellRow}${row.original.storageUnitUsage?.wellColumn}`}
          </>
        );
      },
      header: () => <FieldHeader name={"wellCoordinates"} />,
      accessorKey: "wellCoordinates",
      sortingFn: (a: any, b: any): number => {
        const aString =
          !a.original?.storageUnitUsage ||
          a.original?.storageUnitUsage?.wellRow === null ||
          a.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${a.original.storageUnitUsage?.wellRow}${a.original.storageUnitUsage?.wellColumn}`;
        const bString =
          !b.original?.storageUnitUsage ||
          b.original?.storageUnitUsage?.wellRow === null ||
          b.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${b.original.storageUnitUsage?.wellRow}${b.original.storageUnitUsage?.wellColumn}`;
        return compareByStringAndNumber(aString, bString);
      }
    },
    {
      id: "tubeNumber",
      cell: ({ row: { original } }) =>
        original?.storageUnitUsage?.cellNumber === undefined ? (
          <></>
        ) : (
          <>{original.storageUnitUsage?.cellNumber}</>
        ),
      header: () => <FieldHeader name={"tubeNumber"} />,
      accessorKey: "tubeNumber",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.storageUnitUsage?.cellNumber?.toString(),
          b?.original?.storageUnitUsage?.cellNumber?.toString()
        )
    }
  ];

  const GENERIC_MOLECULAR_ANALYSIS_COLUMNS: ColumnDef<SequencingRunItem>[] = [
    {
      id: "materialSampleName",
      cell: ({ row: { original } }) => {
        const materialSampleName =
          original?.materialSampleSummary?.materialSampleName;
        return (
          <>
            <Link
              href={`/collection/material-sample/view?id=${original.materialSampleId}`}
            >
              {materialSampleName || original.materialSampleId}
            </Link>
          </>
        );
      },
      header: () => <FieldHeader name="materialSampleName" />,
      accessorKey: "materialSampleSummary.materialSampleName",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.materialSampleSummary?.materialSampleName,
          b?.original?.materialSampleSummary?.materialSampleName
        ),
      enableSorting: true
    },
    {
      id: "molecularAnalysisRunItem.name",
      cell: ({ row: { original } }) => {
        return readOnly ? (
          <>{original.molecularAnalysisRunItem?.name}</>
        ) : (
          <input
            type="text"
            className="w-100 form-control"
            defaultValue={original.molecularAnalysisRunItem?.name}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setMolecularAnalysisRunItemNames?.(
                handleMolecularAnalysisRunItemNames(original, event)
              );
            }}
          />
        );
      },
      header: () => <DinaMessage id="molecularAnalysisRunItemName" />,
      accessorKey: "molecularAnalysisRunItem.name",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.materialSampleSummary?.materialSampleName,
          b?.original?.materialSampleSummary?.materialSampleName
        ),
      enableSorting: true
    },
    {
      id: "wellCoordinates",
      cell: ({ row }) => {
        return (
          <>
            {!row.original?.storageUnitUsage ||
            row.original?.storageUnitUsage?.wellRow === null ||
            row.original?.storageUnitUsage?.wellColumn === null
              ? ""
              : `${row.original.storageUnitUsage?.wellRow}${row.original.storageUnitUsage?.wellColumn}`}
          </>
        );
      },
      header: () => <FieldHeader name={"wellCoordinates"} />,
      accessorKey: "wellCoordinates",
      sortingFn: (a: any, b: any): number => {
        const aString =
          !a.original?.storageUnitUsage ||
          a.original?.storageUnitUsage?.wellRow === null ||
          a.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${a.original.storageUnitUsage?.wellRow}${a.original.storageUnitUsage?.wellColumn}`;
        const bString =
          !b.original?.storageUnitUsage ||
          b.original?.storageUnitUsage?.wellRow === null ||
          b.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${b.original.storageUnitUsage?.wellRow}${b.original.storageUnitUsage?.wellColumn}`;
        return compareByStringAndNumber(aString, bString);
      }
    },
    {
      id: "tubeNumber",
      cell: ({ row: { original } }) =>
        original?.storageUnitUsage?.cellNumber === undefined ? (
          <></>
        ) : (
          <>{original.storageUnitUsage?.cellNumber}</>
        ),
      header: () => <FieldHeader name={"tubeNumber"} />,
      accessorKey: "tubeNumber",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.storageUnitUsage?.cellNumber?.toString(),
          b?.original?.storageUnitUsage?.cellNumber?.toString()
        )
    }
  ];

  const GENERIC_MOLECULAR_ANALYSIS_RESULTS_COLUMNS: ColumnDef<SequencingRunItem>[] =
    [
      {
        id: "materialSampleName",
        cell: ({ row: { original } }) => {
          const materialSampleName =
            original?.materialSampleSummary?.materialSampleName;
          return (
            <>
              <Link
                href={`/collection/material-sample/view?id=${original.materialSampleId}`}
              >
                {materialSampleName || original.materialSampleId}
              </Link>
            </>
          );
        },
        header: () => <FieldHeader name="materialSampleName" />,
        accessorKey: "materialSampleSummary.materialSampleName",
        sortingFn: (a: any, b: any): number =>
          compareByStringAndNumber(
            a?.original?.materialSampleSummary?.materialSampleName,
            b?.original?.materialSampleSummary?.materialSampleName
          ),
        enableSorting: true
      },
      {
        id: "molecularAnalysisRunItem.name",
        cell: ({ row: { original } }) => {
          return readOnly ? (
            <>{original.molecularAnalysisRunItem?.name}</>
          ) : (
            <input
              type="text"
              className="w-100 form-control"
              defaultValue={original.molecularAnalysisRunItem?.name}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setMolecularAnalysisRunItemNames?.(
                  (molecularAnalysisRunItemNames) => {
                    const molecularAnalysisRunItemNamesMap =
                      molecularAnalysisRunItemNames;
                    if (
                      original?.materialSampleSummary?.id &&
                      event.target.value
                    ) {
                      molecularAnalysisRunItemNamesMap[
                        original?.materialSampleSummary?.id
                      ] = event.target.value;
                    }
                    return molecularAnalysisRunItemNamesMap;
                  }
                );
              }}
            />
          );
        },
        header: () => <DinaMessage id="molecularAnalysisRunItemName" />,
        accessorKey: "molecularAnalysisRunItem.name",
        sortingFn: (a: any, b: any): number =>
          compareByStringAndNumber(
            a?.original?.materialSampleSummary?.materialSampleName,
            b?.original?.materialSampleSummary?.materialSampleName
          ),
        enableSorting: true
      },
      {
        id: "resultAttachment",
        cell: ({ row: { original } }) => {
          const attachments =
            original.molecularAnalysisRunItem?.result?.attachments ?? [];
          const attachmentElements = attachments?.map((attachment, index) =>
            attachment ? (
              <React.Fragment key={attachment?.id}>
                <Link
                  href={`/object-store/object/view?id=${attachment?.id}`}
                  legacyBehavior
                >
                  {attachment?.originalFilename}
                </Link>
                {index < attachments?.length - 1 && ", "}
              </React.Fragment>
            ) : null
          );

          return (
            <>{attachmentElements?.length > 0 ? attachmentElements : null}</>
          );
        },
        header: () => <FieldHeader name={"resultAttachment"} />,
        accessorKey: "resultAttachment",
        sortingFn: (a: any, b: any): number =>
          compareByStringAndNumber(
            a?.original?.storageUnitUsage?.cellNumber?.toString(),
            b?.original?.storageUnitUsage?.cellNumber?.toString()
          )
      },
      {
        id: "action",
        cell: ({ row: { original } }) => {
          return (
            <div className="settings-button-container">
              <SettingsButton
                menuItems={[
                  <AddAttachmentsButton
                    key={0}
                    removeMargin={true}
                    style={{
                      paddingLeft: "15px",
                      paddingRight: "15px",
                      width: "6rem"
                    }}
                    buttonTextElement={<DinaMessage id="addButtonText" />}
                    value={
                      (original.molecularAnalysisRunItem?.result
                        ?.attachments as ResourceIdentifierObject[]) ?? []
                    }
                    onChange={async (newMetadatas) => {
                      if (original.molecularAnalysisRunItem) {
                        const molecularAnalysisRunResultSaveArgs: SaveArgs<MolecularAnalysisResult>[] =
                          [
                            {
                              type: "molecular-analysis-result",
                              resource: {
                                type: "molecular-analysis-result",
                                group: groupNames?.[0],
                                relationships: {
                                  attachments: {
                                    data: newMetadatas as Metadata[]
                                  }
                                }
                              }
                            } as any
                          ];

                        const savedMolecularAnalysisResult =
                          await save?.<MolecularAnalysisResult>(
                            molecularAnalysisRunResultSaveArgs,
                            {
                              apiBaseUrl: "seqdb-api/molecular-analysis-result"
                            }
                          );
                        const molecularAnalysisRunItemSaveArgs: SaveArgs<MolecularAnalysisRunItem>[] =
                          [
                            {
                              type: "molecular-analysis-run-item",
                              resource: {
                                ...original.molecularAnalysisRunItem,
                                relationships: {
                                  result: {
                                    data: {
                                      id: savedMolecularAnalysisResult?.[0].id,
                                      type: "molecular-analysis-result"
                                    }
                                  }
                                }
                              }
                            } as any
                          ];
                        await save?.<MolecularAnalysisRunItem>(
                          molecularAnalysisRunItemSaveArgs,
                          {
                            apiBaseUrl: "seqdb-api/molecular-analysis-run-item"
                          }
                        );
                        setReloadGenericMolecularAnalysisRun?.(Date.now());
                      }
                    }}
                  />,
                  <button
                    className={`btn btn-danger delete-button`}
                    style={{
                      paddingLeft: "15px",
                      paddingRight: "15px",
                      width: "6rem"
                    }}
                    type="button"
                    key={1}
                    onClick={async () => {
                      if (
                        original.molecularAnalysisRunItem &&
                        original.molecularAnalysisRunItem.result
                      ) {
                        try {
                          const molecularAnalysisRunItemSaveArgs = [
                            {
                              resource: {
                                id: original.molecularAnalysisRunItem.id,
                                type: original.molecularAnalysisRunItem.type,
                                relationships: {
                                  result: {
                                    data: null
                                  }
                                }
                              },
                              type: original.molecularAnalysisRunItem.type
                            }
                          ];
                          await save?.<MolecularAnalysisRunItem>(
                            molecularAnalysisRunItemSaveArgs,
                            {
                              apiBaseUrl:
                                "seqdb-api/molecular-analysis-run-item"
                            }
                          );
                          if (original.molecularAnalysisRunItem.result.id) {
                            const molecularAnalysisRunResultDeleteArgs: DeleteArgs[] =
                              [
                                {
                                  delete: {
                                    id: original.molecularAnalysisRunItem.result
                                      .id,
                                    type: original.molecularAnalysisRunItem
                                      .result.type
                                  }
                                }
                              ];
                            await save?.(molecularAnalysisRunResultDeleteArgs, {
                              apiBaseUrl: "seqdb-api/molecular-analysis-result"
                            });
                          }
                          setReloadGenericMolecularAnalysisRun?.(Date.now());
                        } catch (error) {
                          console.error(error);
                        }
                      }
                    }}
                  >
                    <DinaMessage id="removeButtonText" />
                  </button>
                ]}
              />
            </div>
          );
        },
        header: () => <FieldHeader name={"action"} />,
        accessorKey: "action",
        sortingFn: (a: any, b: any): number =>
          compareByStringAndNumber(
            a?.original?.storageUnitUsage?.cellNumber?.toString(),
            b?.original?.storageUnitUsage?.cellNumber?.toString()
          )
      }
    ];

  const METAGENOMICS_BATCH_ITEM_COLUMNS: ColumnDef<SequencingRunItem>[] = [
    {
      id: "materialSampleName",
      cell: ({ row: { original } }) => {
        const materialSampleName =
          original?.materialSampleSummary?.materialSampleName;
        return (
          <>
            <Link
              href={`/collection/material-sample/view?id=${original.materialSampleId}`}
            >
              {materialSampleName || original.materialSampleId}
            </Link>
          </>
        );
      },
      header: () => <FieldHeader name="materialSampleName" />,
      accessorKey: "materialSampleSummary.materialSampleName",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.materialSampleSummary?.materialSampleName,
          b?.original?.materialSampleSummary?.materialSampleName
        ),
      enableSorting: true
    },
    {
      id: "molecularAnalysisRunItem.name",
      cell: ({ row: { original } }) => {
        return readOnly ? (
          <>{original.molecularAnalysisRunItem?.name}</>
        ) : (
          <input
            type="text"
            className="w-100 form-control"
            defaultValue={original.molecularAnalysisRunItem?.name}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setMolecularAnalysisRunItemNames?.(
                handleMolecularAnalysisRunItemNames(original, event)
              );
            }}
          />
        );
      },
      header: () => <DinaMessage id="molecularAnalysisRunItemName" />,
      accessorKey: "molecularAnalysisRunItem.name",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.materialSampleSummary?.materialSampleName,
          b?.original?.materialSampleSummary?.materialSampleName
        ),
      enableSorting: true
    },
    {
      id: "wellCoordinates",
      cell: ({ row }) => {
        return (
          <>
            {!row.original?.storageUnitUsage ||
            row.original?.storageUnitUsage?.wellRow === null ||
            row.original?.storageUnitUsage?.wellColumn === null
              ? ""
              : `${row.original.storageUnitUsage?.wellRow}${row.original.storageUnitUsage?.wellColumn}`}
          </>
        );
      },
      header: () => <FieldHeader name={"wellCoordinates"} />,
      accessorKey: "wellCoordinates",
      sortingFn: (a: any, b: any): number => {
        const aString =
          !a.original?.storageUnitUsage ||
          a.original?.storageUnitUsage?.wellRow === null ||
          a.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${a.original.storageUnitUsage?.wellRow}${a.original.storageUnitUsage?.wellColumn}`;
        const bString =
          !b.original?.storageUnitUsage ||
          b.original?.storageUnitUsage?.wellRow === null ||
          b.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${b.original.storageUnitUsage?.wellRow}${b.original.storageUnitUsage?.wellColumn}`;
        return compareByStringAndNumber(aString, bString);
      }
    },
    {
      id: "tubeNumber",
      cell: ({ row: { original } }) =>
        original?.storageUnitUsage?.cellNumber === undefined ? (
          <></>
        ) : (
          <>{original.storageUnitUsage?.cellNumber}</>
        ),
      header: () => <FieldHeader name={"tubeNumber"} />,
      accessorKey: "tubeNumber",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.storageUnitUsage?.cellNumber?.toString(),
          b?.original?.storageUnitUsage?.cellNumber?.toString()
        )
    }
  ];
  const MOLECULAR_ANALYSIS_RUN_COLUMNS_MAP = {
    "seq-reaction": SEQ_REACTION_COLUMNS,
    "generic-molecular-analysis-item": GENERIC_MOLECULAR_ANALYSIS_COLUMNS,
    "metagenomics-batch-item": METAGENOMICS_BATCH_ITEM_COLUMNS,
    "generic-molecular-analysis-results":
      GENERIC_MOLECULAR_ANALYSIS_RESULTS_COLUMNS
  };
  return MOLECULAR_ANALYSIS_RUN_COLUMNS_MAP[type];

  function handleMolecularAnalysisRunItemNames(
    original: SequencingRunItem,
    event: ChangeEvent<HTMLInputElement>
  ): SetStateAction<Record<string, string>> {
    return (molecularAnalysisRunItemNames) => {
      const molecularAnalysisRunItemNamesMap = molecularAnalysisRunItemNames;
      if (original?.materialSampleSummary?.id) {
        molecularAnalysisRunItemNamesMap[original?.materialSampleSummary?.id] =
          event.target.value;
      }
      return molecularAnalysisRunItemNamesMap;
    };
  }
}
