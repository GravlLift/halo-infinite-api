import { PlayerMatchHistory } from "../../models/halo-infinite/player-match-history";

export type QueryMap = {
  Economy: {
    WeaponCoreCustomization: {};
  };
};

export type PathMap = {
  Economy: {
    WeaponCoreCustomization: {};
  };
};

export type ResultMap = {
  Stats: {
    GetMatchHistory: PlayerMatchHistory;
  };
};
