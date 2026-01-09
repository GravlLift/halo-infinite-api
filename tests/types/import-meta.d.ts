// Test-only augmentation to match Node ESM runtime conveniences
// Do not ship with production typings
interface ImportMeta {
  dirname: string;
}
