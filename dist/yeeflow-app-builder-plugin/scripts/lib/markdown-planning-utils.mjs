// Compatibility shim: Wave 1 routes only immutable Markdown planning behavior
// through the official distributed Core planning artifact.
export {
  splitMarkdownTableRow,
  isMarkdownTableSeparator,
  parseMarkdownTables,
  stripMarkdownFencedBlocks,
  findMarkdownTable,
  markdownRowValue,
  markdownRowValues,
  extractMarkdownSubsection,
  isNegativeRequirementStatement,
  positivePlanningText,
  hasTechnicalPlaceholderIdContext,
} from "./markdown-planning-core-adapter.mjs";
