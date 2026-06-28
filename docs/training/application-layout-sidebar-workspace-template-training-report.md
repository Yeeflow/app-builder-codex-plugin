# Application Layout Sidebar Workspace Template Training Report

## Scope

This training registers `application-layout-sidebar-workspace-1` as the default package-level application layout golden reference for generated Yeeflow applications.

The template is extracted from the application settings `ListSet.LayoutView` in the provided `Business Travel Request 0.8.85 Codex Lite Fresh - Yeeflow App Plan-v1.1.yapk` reference package. It targets the Yeeflow `application-layout-1-vertical-nav` layout: a compact top header plus a persistent left navigation panel.

## Golden Reference Contract

- `ListSet.LayoutView.sortVer` must be `1`.
- Header appearance must preserve the reference values:
  - background: `var(--c--primary-dark-hover)`
  - text color: `var(--c--background)`
  - height: `46`
  - typography: `[null, "h6-semi-bold"]`
- Navigation menu appearance must preserve the reference values:
  - position: `left`
  - background: `var(--c--primary-dark)`
  - text color: `var(--c--background)`
  - active: `{}`
- Custom color/font metadata from the reference LayoutView must be preserved.
- Every visible business navigation group and menu item must have a suitable FontAwesome icon.
- Hidden process/task navigation entries may keep Yeeflow built-in process icons.

## Generator Rule

The full-app materializer must emit this template into `decoded.ListSet.LayoutView` for new generated applications by default. It must not generate a package that omits the application layout attrs or visible menu icons.

This layout contract is separate from the Soft outline controls application control style. The control style still lives in `Themes[]`; the application layout lives in `ListSet.LayoutView`.

## Validation

New hard gates validate:

- template registry/reference quality;
- package LayoutView appearance fidelity;
- navigation menu position and color fidelity;
- CustomColors/CustomFonts fidelity;
- visible navigation FontAwesome icon coverage;
- materializer output using the registered default layout template.
