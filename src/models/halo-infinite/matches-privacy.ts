export enum Privacy {
  Show = 1,
  Hide = 2,
}

export interface MatchesPrivacy {
  MatchmadeGames: Privacy;
  OtherGames: Privacy;
}
