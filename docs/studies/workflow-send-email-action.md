# Workflow Send Email Action

Source export: `/Users/Renger/Downloads/AI Agent and Copilot Local Resource Baseline8.yap`

Classification: export-proven action shape only. Email sending was not runtime-tested.

## Node Shape

Send email uses workflow node `stencil.id = "MailTask"`.

Observed properties:

| Property | Description |
| --- | --- |
| `name` | node display name |
| `to` | recipient rich-text string; can be a fixed email text or expression-button HTML |
| `subject` | subject rich-text string; can be literal or expression-button HTML |
| `html` | body HTML/rich-text string |
| `cc` | supported by normalized action reference, not present in the studied nodes |
| `from` | supported by normalized action reference, not present in the studied nodes |
| `files` | supported by normalized action reference, not present in the studied nodes |

## Weekly Test Email

`Weekly information update` contains one `MailTask`:

- node name: `Send Test Email`
- recipient: fixed email text, redacted as `<REDACTED_EMAIL>`
- subject: `Test email`
- body: simple HTML paragraphs

This is useful for action anatomy but must not be executed during automated tests because the recipient is a real fixed address in the source export.

## Daily Generated Email

`Daily information update` contains one `MailTask`:

- recipient: fixed email text, redacted as `<REDACTED_EMAIL>`
- subject: expression-button HTML referencing workflow variable `EmailSubject`
- body: expression-button HTML referencing workflow variable `EmailBody`

The workflow variable expression button pattern is:

```html
<input type="button" data="${&quot;type&quot;:&quot;variable&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;EmailSubject&quot;}}" expr="__" tabindex="-1" value="Workflow Variables:Subject">
```

## Safety Rules

- Redact fixed recipients in docs and normalized references.
- Warn on fixed email recipients in compatibility validation.
- Do not run Scheduled Workflow or Send email actions unless recipients are explicitly safe test recipients.
- For generated packages, prefer placeholder/example recipients or keep the workflow disabled/non-executed until safe runtime behavior is proven.
- Validate `to`, `subject`, and `html` are present before any runtime test.
