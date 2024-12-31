interface MedalSprite {
  path: string;
  columns: number;
  size: number;
}

interface Medal {
  name: {
    value: string;
    translations: Record<string, string>;
  }
  description: {
    value: string;
    translations: Record<string, string>;
  }
  spriteIndex: number;
  sortingWeight: number;
  difficultyIndex: number;
  typeIndex: number;
  personalScore: number;
  nameId: number;
}

export interface MedalsMetadataFile {
  difficulties: string[];
  types: string[];
  sprites: Record<string, MedalSprite>;
  medals: Medal[];
}
