export interface SpartanTokenProvider {
  getSpartanToken(): Promise<string>;
  clearSpartanToken(): Promise<void>;
}
