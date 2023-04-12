import { SpartanTokenProof } from "./spartan-token-proof";

export interface SpartanTokenRequest {
  Audience: string;
  MinVersion: string;
  Proof: SpartanTokenProof[];
}
