// Normalize legacy template placement to the exported control-level binding.
export function normalizeFilterBinding(control) {
  const top = control.binding;
  const legacy = control.attrs?.binding;
  if (top && legacy && top !== legacy) throw new Error(`FILTER_BINDING_CONFLICT: ${control.id || control.type}`);
  const binding = top || legacy;
  if (binding) control.binding = binding;
  if (control.attrs) delete control.attrs.binding;
  return binding;
}
