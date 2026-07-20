/**
 * Internal-only Phase 9I shadow. Host context selection remains outside Core;
 * Core returns only the frozen export-proven embedded schema descriptor.
 */
import {
  projectDataListEmbeddedSublistSchemaInternal,
  type EmbeddedSublistSchemaDescriptor,
  type EmbeddedSublistSchemaInput,
} from "./data-list-sublist-embedded-schema.js";

export type FrozenEmbeddedSublistDescriptorInput = EmbeddedSublistSchemaInput;
export type FrozenEmbeddedSublistDescriptor = EmbeddedSublistSchemaDescriptor;

export function projectDataListSublistFrozenDescriptorInternal(input: FrozenEmbeddedSublistDescriptorInput): FrozenEmbeddedSublistDescriptor {
  return projectDataListEmbeddedSublistSchemaInternal(input);
}
