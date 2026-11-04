export interface Film {
  FilmStatusBond: number;
  CustomData: {
    FilmLength: number;
    Chunks: {
      Index: number;
      ChunkStartTimeOffsetMilliseconds: number;
      DurationMilliseconds: number;
      ChunkSize: number;
      FileRelativePath: `/filmChunk${number}`;
      ChunkType: number;
    }[];
    HasGameEnded: boolean;
    ManifestRefreshSeconds: number;
    MatchId: string;
    FilmMajorVersion: number;
  };
  BlobStoragePathPrefix: string;
  AssetId: string;
}
