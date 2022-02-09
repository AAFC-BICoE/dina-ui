import { Determination } from "..";

export interface Organism {
  lifeStage?: string | null;
  sex?: string | null;
  remarks?: string | null;
  determination?: Determination[] | null;
}
