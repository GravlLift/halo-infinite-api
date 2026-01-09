// Build-time ambient type for non-standard import.meta.dirname used by our Node ESM runtime
// This file is only for typing; it does not change runtime behavior.
interface ImportMeta {
  dirname: string;
}
