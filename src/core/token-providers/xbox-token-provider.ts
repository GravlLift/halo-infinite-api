export interface XboxTokenProvider {
  getXboxLiveV3Token: () => Promise<string>;
}
