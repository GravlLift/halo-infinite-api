export interface XboxTokenProvider {
  getXboxLiveV3Token: () => Promise<string>;
  clearXboxLiveV3Token: () => Promise<void>;
}
