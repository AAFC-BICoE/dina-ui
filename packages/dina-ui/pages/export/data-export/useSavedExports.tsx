import { useAccount, useApiClient } from "common-ui/lib";
import { UserPreference } from "../../../types/user-api";
import { FilterParam } from "kitsu";
import { useEffect, useState } from "react";
import { SavedExportColumnStructure } from "./types";

export interface UseSavedExportsProp {
  indexName: string;
}

export function useSavedExports({ indexName }: UseSavedExportsProp) {
  const { save, apiClient } = useApiClient();
  const { subject } = useAccount();

  const [userPreferenceID, setUserPreferenceID] = useState<string>();
  const [allSavedExports, setAllSavedExports] = useState<
    SavedExportColumnStructure[]
  >([]);
  const [loadingSavedExports, setLoadingSavedExports] = useState<boolean>(true);
  const [selectedSavedExport, setSelectedSavedExport] =
    useState<SavedExportColumnStructure>();

  function createSavedExport(name: string, columns: string[]) {
    return;
  }

  function updateSavedExport() {
    // Cannot update a saved export if no saved export is selected.
    if (!selectedSavedExport) {
      return;
    }
  }

  function deleteSavedExport() {
    // Cannot delete a saved export if no saved export is selected.
    if (!selectedSavedExport) {
      return;
    }
  }

  async function retrieveSavedExports() {
    setLoadingSavedExports(true);
    await apiClient
      .get<UserPreference[]>("user-api/user-preference", {
        filter: {
          userId: subject as FilterParam
        }
      })
      .then((response) => {
        setLoadingSavedExports(false);
        setUserPreferenceID(response?.data?.[0]?.id ?? undefined);

        if (response?.data?.[0]?.savedExportColumnSelection) {
          setAllSavedExports(
            response.data[0].savedExportColumnSelection.filter(
              (savedExport) => savedExport.component === indexName
            )
          );
        }
      })
      .catch((userPreferenceError) => {
        console.error(userPreferenceError);
        setLoadingSavedExports(false);
      });
  }

  useEffect(() => {
    retrieveSavedExports();
  }, []);

  return {
    createSavedExport,
    updateSavedExport,
    deleteSavedExport,
    allSavedExports,
    loadingSavedExports,
    setSelectedSavedExport,
    selectedSavedExport
  };
}
