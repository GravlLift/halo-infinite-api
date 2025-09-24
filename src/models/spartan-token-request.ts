import { SpartanTokenProof } from "./spartan-token-proof.js";

export interface SpartanTokenRequest {
  Audience: string;
  MinVersion: string;
  Proof: SpartanTokenProof[];
}
