import {
  DinaFormSection,
  filterBy,
  ResourceSelectField
} from "packages/common-ui/lib";
import { ThermocyclerProfile } from "packages/dina-ui/types/seqdb-api";
import styles from "./ThermocylerProfileWorksheetElement.module.css";

export function ThermocyclerProfileWorksheetElement({
  thermocyclerProfile
}: {
  thermocyclerProfile?: ThermocyclerProfile;
}) {
  return !!thermocyclerProfile ? (
    <>
      <DinaFormSection horizontal={[4, 8]}>
        <ResourceSelectField<ThermocyclerProfile>
          className="col-sm-12"
          name="thermocyclerProfile"
          filter={filterBy(["name"])}
          model="seqdb-api/thermocycler-profile"
          optionLabel={(profile) => profile.name}
          readOnlyLink="/seqdb/thermocycler-profile/view?id="
          isDisabled={true}
        />
      </DinaFormSection>
      <div className={styles["step-container"] + " mb-2"}>
        {thermocyclerProfile.steps?.map((step, index) => (
          <div key={index} className={styles[`step${index + 1}`] + " mb-2"}>
            <label>
              <strong>Step {index + 1}</strong>
            </label>
            <input
              type="text"
              className="form-control"
              disabled={true}
              value={step}
            />
          </div>
        ))}
      </div>
      <div className={styles["step-container"] + " mb-2"}>
        <div className={styles["cycles-container"]}>
          <label>
            <strong>Cycles</strong>
          </label>
          <input
            type="text"
            className="form-control"
            disabled={true}
            value={thermocyclerProfile?.cycles || ""}
          />
        </div>
      </div>
    </>
  ) : null;
}
