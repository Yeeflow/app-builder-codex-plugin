// Opt-in DOM-dependent fallback. Desktop live-update proof only; see the standard.
const START = '/* collection-toolbar-v1:start */';
const END = '/* collection-toolbar-v1:end */';
const BUTTON = 'selector .ak-form-button-btn{min-height:40px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;}';
const SELECT = 'selector .ant-select-selection--single{height:40px!important;min-height:40px;padding:0 8px!important;border-radius:8px;border-color:#DDE3EE;background:#F8FAFD;} selector .ant-select-selection__rendered{height:38px!important;line-height:38px!important;margin:0!important;position:relative;} selector .ant-select-selection-selected-value{height:38px;line-height:38px!important;} selector .ant-select-selection__placeholder{top:0!important;bottom:auto!important;margin:0!important;height:38px!important;line-height:38px!important;align-items:center;}';

function installCss(control, css) {
  control.attrs ??= {};
  control.attrs.common ??= {};
  const old = control.attrs.common.css || '';
  const start = old.indexOf(START), end = old.indexOf(END);
  if ((start < 0) !== (end < 0) || (start >= 0 && end < start)) throw new Error('TOOLBAR_CSS_MARKER_INVALID');
  const preserved = start < 0 ? old : old.slice(0, start) + old.slice(end + END.length);
  control.attrs.common.css = `${preserved.trim()}\n${START}\n${css}\n${END}`.trim();
  return control;
}

export function applyCollectionToolbarStyle(control, role) {
  if (role === 'add' && control?.type === 'action_button') return installCss(control, BUTTON);
  if (role === 'select' && control?.type === 'select-filter') return installCss(control, SELECT);
  throw new Error('TOOLBAR_STYLE_ROLE_TYPE_MISMATCH');
}

export function configureCollectionRowMenu(control) {
  if (control?.type !== 'dropbar') throw new Error('ROW_MENU_TYPE_MISMATCH');
  control.attrs ??= {};
  control.attrs.settings ??= {};
  const settings = control.attrs.settings;
  // A mobile-only value must not masquerade as a desktop placement.
  if (settings.position != null && !Array.isArray(settings.position)) throw new Error('ROW_MENU_POSITION_SHAPE_UNPROVEN');
  settings.position = [...(settings.position || [null])];
  settings.position[1] ??= 'bottomRight';
  settings.position[3] ??= 'bottomRight';
  settings.autoposition = true;
  return control;
}

export function applyDarkMenuButtonStyle(control) {
  if (control?.type !== 'action_button') throw new Error('MENU_BUTTON_TYPE_MISMATCH');
  return installCss(control, 'selector .ak-form-button-btn,selector .ak-form-button-btn:hover,selector .ak-form-button-btn:active{color:#FFFFFF!important;} selector .ak-form-button-btn .ak-form-button-inner,selector .ak-form-button-btn i,selector .ak-form-button-btn pre{color:inherit;}');
}

export function inspectCollectionToolbarScope(root) {
  const findings = [];
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'container' && /selector\s+\.ak-form-button-btn\s*\{[^}]*\b(?:min-height|height|color)\s*:/.test(node.attrs?.common?.css || '')) {
      findings.push({level:'warning',code:'COLLECTION_BROAD_BUTTON_CSS',id:node.id});
    }
    for (const child of node.children || []) walk(child);
    for (const column of node.attrs?.tablecols || []) walk(column);
  }
  walk(root);
  return findings;
}
