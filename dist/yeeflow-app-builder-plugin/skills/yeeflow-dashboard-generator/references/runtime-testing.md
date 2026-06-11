# Runtime Testing

Only operate Yeeflow UI when the user explicitly asks for runtime testing.

Runtime environment:

`https://<yourdomain>.yeeflow.com`

## Import Flow

1. Open Yeeflow.
2. Go to Shared Workspace.
3. Click New application.
4. Choose Import application.
5. Upload the generated `.yap`.
6. Click Next step.
7. Confirm the metadata dialog.
8. Refresh the workspace if the card does not appear immediately.
9. Open the imported app.

## Evidence To Capture

Success:

- import metadata dialog shows expected title/description/icon
- app appears in Shared Workspace
- app opens
- dashboard navigation renders
- dashboard page shell or content renders

Failure:

- failed API endpoint
- request payload shape
- response body or toast
- console errors
- whether the metadata dialog parsed the package
- whether failure happened before or after final OK

If import fails, do not patch the complex package directly. Create the next smaller isolation package with fresh IDs.
