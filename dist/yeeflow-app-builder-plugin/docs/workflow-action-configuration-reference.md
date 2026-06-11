# Yeeflow Workflow Action Configuration Reference

Source: `<downloads>/node-configurations.json` (read-only user-supplied reference).

This reference normalizes the official workflow action configuration JSON into generator-friendly node/action rules. Use `workflow-action-configurations.normalized.json` as the machine-readable companion.

## Inventory

- Actions inventoried: 28
- Schema version: `2026-05-13.workflow-action-configurations.v1`

| Action | Risk | Required Properties | Enum Properties | Conditional Properties | Nested Schemas |
| --- | --- | ---: | ---: | ---: | ---: |
| `AI` | external_or_credential_sensitive | 0 | 4 | 13 | 3 |
| `AcrobatSign` | external_or_credential_sensitive | 0 | 0 | 0 | 0 |
| `AddWatermark` | document_dependency | 0 | 3 | 2 | 1 |
| `AzureOpenAI` | external_or_credential_sensitive | 0 | 4 | 7 | 1 |
| `CandidateTask` | standard | 0 | 3 | 10 | 1 |
| `Connector` | external_or_credential_sensitive | 0 | 0 | 0 | 0 |
| `ContentList` | standard | 0 | 2 | 6 | 2 |
| `ConvertToPdf` | document_dependency | 0 | 1 | 1 | 1 |
| `Delay` | standard | 0 | 3 | 7 | 1 |
| `DocuSign` | external_or_credential_sensitive | 0 | 5 | 7 | 0 |
| `DocumentRecognition` | external_or_credential_sensitive | 0 | 5 | 3 | 1 |
| `EndNoneEvent` | standard | 1 | 1 | 6 | 0 |
| `EndRejectEvent` | standard | 1 | 1 | 6 | 0 |
| `GenerateDocument` | document_dependency | 0 | 2 | 1 | 1 |
| `HttpRequest` | external_or_credential_sensitive | 0 | 2 | 2 | 0 |
| `InclusiveGateway` | standard | 1 | 0 | 0 | 0 |
| `Loop` | standard | 0 | 2 | 4 | 2 |
| `LoopBreak` | standard | 0 | 0 | 0 | 0 |
| `MailTask` | standard | 0 | 1 | 1 | 0 |
| `MultiAssignmentTask` | standard | 1 | 4 | 12 | 2 |
| `PandaDoc` | external_or_credential_sensitive | 0 | 4 | 4 | 1 |
| `QueryData` | standard | 0 | 4 | 9 | 3 |
| `ResponseTo` | standard | 0 | 0 | 0 | 0 |
| `SequenceFlow` | standard | 1 | 0 | 0 | 1 |
| `SetVariableTask` | standard | 0 | 1 | 4 | 1 |
| `SignalEvent` | standard | 0 | 0 | 1 | 1 |
| `StartNoneEvent` | standard | 1 | 1 | 8 | 2 |
| `StartWorkflowTask` | standard | 0 | 2 | 4 | 1 |

## AI

- Control types: `AI`
- Support status: partially supported; external or credential-dependent and must not be bundled with sensitive values
- Conditional: `properties.image.type`, `properties.image.value`, `properties.user.value`, `properties.assistant.type`, `properties.assistant.value`, `properties.file`, `properties.response.value`, `properties.data.AppID`, `properties.data.ListSetID`, `properties.data.AgentID`, `properties.enableSearch`, `properties.inputVariables`, `properties.outputVariables`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.image.type` | `string` | no |  | properties | Fixed value 2, indicating that the value of properties.image.value is determined by Yeeflow Calculation expression.(When properties.type is 'img') |
| `properties.image.value` | `string` | no |  | properties | Yeeflow Calculation expression.(When properties.type is 'img') |
| `properties.user.type` | `enum` | no | `0`, `2` |  | Select the type of user message. |
| `properties.user.value` | `string` | no |  | properties | User message.(When properties.user.type is 0, it is text. When properties.user.type is 2, its value is determined by a Yeeflow Calculation expression.) |
| `properties.assistant.type` | `enum` | no | `0`, `2` | properties | Select the type of assistant instructions.(When properties.type is not 'agent') |
| `properties.assistant.value` | `string` | no |  | properties | Assistant instructions.(When properties.type is not 'agent'. When properties.assistant.type is 0, it is text. When properties.assistant.type is 2, its value is determined by a Yeeflow Calculation expression.) |
| `properties.file` | `array` | no |  | properties | Defines different types of expression configurations, supports Yeeflow Calculation expression or workflow variable(When properties.type is 'file' or properties.type is 'chat') |
| `properties.response.prefix` | `enum` | no | `__variables_`, `__list_` |  | select the type of variable to save the response to. |
| `properties.response.value` | `string` | no |  | properties | select the variable id to save the response to.Only 'text' type variable is supported.(When properties.type is not 'agent') |
| `properties.type` | `enum` | no | `chat`, `img`, `file`, `agent` |  | Select the event type of AI model. |
| `properties.data.AppID` | `number` | no |  | properties | The AppID of the Azure AI Document Intelligence resource.(When properties.type is 'agent') |
| `properties.data.ListSetID` | `string` | no |  | properties | The listset ID of the Azure AI Document Intelligence resource.(When properties.type is 'agent') |
| `properties.data.AgentID` | `string` | no |  | properties | The AgentID of the Azure AI Document Intelligence resource.(When properties.type is 'agent') |
| `properties.enableSearch` | `boolean` | no |  | properties | Enable search.(When properties.type is 'chat' && properties.file is  empty) |
| `properties.inputVariables` | `array` | no |  | properties; type is 1, Yeeflow Calculation expression when type is 2)"}},"additionalProperties":false}},"additionalProperties":false},"minItems":1} | Defines configuration for input variables (When properties.type is 'agent') |
| `properties.outputVariables` | `array` | no |  | properties; type is __variables__, List Field ID when type is __list__)"}},"additionalProperties":false}},"additionalProperties":false},"minItems":1} | Defines configuration for output variables (When properties.type is 'agent') |

Nested schema notes:
- `properties.file`: Defines different types of expression configurations, supports Yeeflow Calculation expression or workflow variable(When properties.type is 'file' or properties.type is 'chat')
- `properties.inputVariables`: Defines configuration for input variables (When properties.type is 'agent')
- `properties.outputVariables`: Defines configuration for output variables (When properties.type is 'agent')

Export-backed scheduled workflow note: `AI Agent and Copilot Local Resource Baseline8.yap` proves `properties.type = "agent"` can invoke an app-contained AI Agent from a Scheduled Workflow. The action stores the Agent reference in `properties.data.AgentID`, passes workflow variables through `properties.inputVariables[].value`, maps Agent outputs back to workflow variables through `properties.outputVariables[].value.prefix = "__variables_"`, and may enable AI Assistant context enrichment under `properties.context.selected`.

## AcrobatSign

- Control types: `AcrobatSign`
- Support status: partially supported; external or credential-dependent and must not be bundled with sensitive values

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.auth.type` | `string` | no |  |  | Fixed value 'apiKey'. This field must be set to 'apiKey' to indicate API key authentication for AcrobatSign. |
| `properties.auth.value` | `string` | no |  |  | The API key to use for authentication. |
| `properties.signType` | `string` | no |  |  | The type of signing process (e.g., SEQUENCE). |
| `properties.agreementName` | `string` | no |  |  | The name of the agreement to sign. Rich Text Editor is supported. |
| `properties.signers` | `string` | no |  |  | The signers of the agreement. Rich Text Editor is supported. |
| `properties.signCcs` | `string` | no |  |  | The CC recipient of the agreement. Rich Text Editor is supported. |
| `properties.signFiles.list` | `array` | no |  |  | Retrieve source files from  list field.Supports type file-upload |
| `properties.signFiles.variables` | `array` | no |  |  | Retrieve source files from  variable.Supports type file. |
| `properties.signedFile` | `string` | no |  |  | Save the signed file to a variable.Supports type file. |
| `properties.signedStatus` | `string` | no |  |  | Save the signed status to a variable.Supports type text. |
| `properties.signedAuditTrailFile` | `string` | no |  |  | Save the signed audit trail file to a variable.Supports type file. |
| `properties.ext` | `string` | no |  |  | Extended parameters. Rich Text Editor is supported. |

## AddWatermark

- Control types: `AddWatermark`
- Support status: partially supported; requires document/template dependency validation
- Conditional: `properties.watermarks`, `properties.outputFileName.type`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.saveToVariable.prefix` | `enum` | no | `__variables_`, `__list_` |  | select the type of variable to save the result to. |
| `properties.saveToVariable.value` | `string` | no |  |  | select the variable id to save the result to.Only 'file' type variable is supported. |
| `properties.inputFile.value` | `object` | no |  |  | If type is 1, it is a variable configuration with format {"exprType":"variable","valueType":"file","id":"Variable ID","type":"expr"}; if type is 2, it is a Yeeflow calculation expression. |
| `properties.inputFile.type` | `enum` | no | `1`, `2` |  | select the type of variable to save the result to. |
| `properties.watermarks` | `array` | no |  | type is image)","additionalProperties":false},"content1":{"type":"object","properties":{"type":{"type":"integer","const":2,"description":"Content type: 2 - Expression array"},"value":{"type":"array","description":"Yeeflow Calculation expression"}},"description":"First line text configuration (when type is text)","additionalProperties":false},"content2":{"type":"object","properties":{"type":{"type":"integer","const":2,"description":"Content type: 2 - Expression array"},"value":{"type":"array","description":"Yeeflow Calculation expression"}},"description":"Second line text configuration (when type is text)","additionalProperties":false},"style":{"type":"string","description":"Watermark style","enum":["repeat","single"]},"position":{"type":"string","enum":["top-left","top-center","top-right","center-center","bottom-left","bottom-center","bottom-right"],"description":"Watermark position (when style is single)"},"repeatPattern":{"type":"string","enum":["full-page","diagonal"],"description":"Repeat pattern (when style is repeat)"},"offsetX":{"type":"integer","description":"Horizontal offset (px) (when style is single)"},"offsetY":{"type":"integer","description":"Vertical offset (px) (when style is single)"},"horizontal":{"type":"integer","description":"Horizontal spacing (when style is repeat)"},"vertical":{"type":"integer","description":"Vertical spacing (when style is repeat)"},"fontSize":{"type":"integer","description":"Font size (px) (when type is text)"},"fontWeight":{"type":"string","enum":["100","200","300","400","500","600","700","800","900","0","1","2"],"description":"Font weight (when type is text), 0:default, 1:normal, 2:bold"},"width":{"type":"integer","description":"Width of the watermark image (px) (when type is image)"},"rotation":{"type":"integer","description":"Rotation angle (degrees)"},"transparency":{"type":"integer","description":"Transparency (0-100%)"},"color":{"type":"string","description":"Font color (when type is text)"}}},"minItems":1} | Defines the configuration of document watermarks, supporting both text and image types. |
| `properties.outputFileType` | `enum` | no | `pdf`, `original` |  | Set the type of output file. |
| `properties.outputFileName.value` | `array` | no |  |  | Yeeflow calculation expression to evaluate the value to pass.  |
| `properties.outputFileName.type` | `number` | no |  | properties | Fixed value 2 when properties.outputFileName.value is present, indicating that properties.outputFileName.value is an array from the expression editor. |

Nested schema notes:
- `properties.watermarks`: Defines the configuration of document watermarks, supporting both text and image types.

## AzureOpenAI

- Control types: `AzureOpenAI`
- Support status: partially supported; external or credential-dependent and must not be bundled with sensitive values
- Conditional: `properties.image.type`, `properties.image.value`, `properties.user.value`, `properties.assistant.type`, `properties.assistant.value`, `properties.file`, `properties.response.value`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.image.type` | `string` | no |  | properties | Fixed value 2, indicating that the value of properties.image.value is determined by Yeeflow Calculation expression.(When properties.type is 'img') |
| `properties.image.value` | `string` | no |  | properties | Yeeflow Calculation expression.(When properties.type is 'img') |
| `properties.user.type` | `enum` | no | `0`, `2` |  | Select the type of user message. |
| `properties.user.value` | `string` | no |  | properties | User message.(When properties.user.type is 0, it is text. When properties.user.type is 2, its value is determined by a Yeeflow Calculation expression.) |
| `properties.assistant.type` | `enum` | no | `0`, `2` | properties | Select the type of assistant instructions.(When properties.type is not 'agent') |
| `properties.assistant.value` | `string` | no |  | properties | Assistant instructions.(When properties.type is not 'agent'. When properties.assistant.type is 0, it is text. When properties.assistant.type is 2, its value is determined by a Yeeflow Calculation expression.) |
| `properties.file` | `array` | no |  | properties | Defines different types of expression configurations, supports Yeeflow Calculation expression or workflow variable(When properties.type is 'file' or properties.type is 'chat') |
| `properties.response.prefix` | `enum` | no | `__variables_`, `__list_` |  | select the type of variable to save the response to. |
| `properties.response.value` | `string` | no |  | properties | select the variable id to save the response to.Only 'text' type variable is supported.(When properties.type is not 'agent') |
| `properties.connectionId` | `string` | no |  |  | The connection ID of the resource. |
| `properties.type` | `enum` | no | `chat`, `img` |  | Select the event type of AI model. |

Nested schema notes:
- `properties.file`: Defines different types of expression configurations, supports Yeeflow Calculation expression or workflow variable(When properties.type is 'file' or properties.type is 'chat')

## CandidateTask

- Control types: `CandidateTask`
- Support status: supported for structural validation
- Conditional: `properties.usertaskassignment`, `properties.duedatedefinition`, `properties.duedateexpress`, `properties.isfromworkcalendar`, `properties.from`, `properties.to`, `properties.cc`, `properties.subject`, `properties.files.list`, `properties.html`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.displayname` | `string` | no |  |  | The title or heading displayed at the top of a task form that is generated or initiated from a task list or workflow item. You can use the rich text editor to retrieve the task title. |
| `properties.usertaskassignment` | `array` | no |  | type is position)"},"value":{"type":"string","description":"Value (user ID, organization ID, position ID, or rich text)"},"title":{"type":"string","description":"Display title, may contain rich text | Defines the configuration for the Task assignee editor, supporting multiple selection methods and rich text |
| `properties.taskurl` | `string` | no |  |  | The URL of the task form that is generated or initiated from a task list or workflow item.  |
| `properties.tasktype` | `enum` | no | `approve`, `complete` |  | The type of task to be performed. If set to 'approve', 'Approve' and 'Reject' buttons will be displayed. If set to 'complete', a 'Complete' button will be displayed. |
| `properties.duedatetype` | `enum` | no | `hour`, `express`, `day`, `minute` |  | Specifies the due date type for the task. |
| `properties.duedatedefinition` | `number` | no |  | properties | Specifies the due date for the task. The format depends on the due date type. (When properties.duedatetype is hour, day, or minute) |
| `properties.duedateexpress` | `string` | no |  | properties | Specifies the express completion date for the task by a rich text editor. (When properties.duedatetype is express) |
| `properties.isfromworkcalendar` | `boolean` | no |  | properties | Specifies whether the express completion date is from the work calendar. (When properties.duedatetype is day) |
| `properties.disablequickapproval` | `boolean` | no |  |  | Specifies whether to disable quick approval.if false, the workflow task will allow direct task processing in notification message cards. |
| `properties.isenabledemail` | `boolean` | no |  |  | Specifies whether to enable email notifications. |
| `properties.from` | `enum` | no | `0`, `-1` | properties | Specifies the sender of the notification message.(When properties.isenabledemail is true) |
| `properties.to` | `string` | no |  | properties | Specifies the recipient of the notification message by a rich editor.(When properties.isenabledemail is true) |
| `properties.cc` | `string` | no |  | properties | Specifies the carbon copy recipient of the notification message by a rich editor.(When properties.isenabledemail is true) |
| `properties.subject` | `string` | no |  | properties | Specifies the subject of the notification message by a rich editor.(When properties.isenabledemail is true) |
| `properties.files.list` | `array` | no |  | list workflow task) | Specifies the file fields to be attached in the notification message.(When list workflow task) |
| `properties.files.variables` | `array` | no |  |  | Specifies the variables to be replaced in the notification message. |
| `properties.html` | `string` | no |  | properties | Specifies the content of the notification message by a rich editor.(When properties.isenabledemail is true) |

Nested schema notes:
- `properties.usertaskassignment`: Defines the configuration for the Task assignee editor, supporting multiple selection methods and rich text

## Connector

- Control types: `Connector`
- Support status: partially supported; external or credential-dependent and must not be bundled with sensitive values

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |

## ContentList

- Control types: `ContentList`
- Support status: supported for structural validation
- Conditional: `properties.appid`, `properties.listsetid`, `properties.listid`, `properties.type`, `properties.listdatas`, `properties.wheres`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.listtype` | `enum` | no | `current`, `select` |  | Specifies the data source for the operation. If set to 'Current list', it uses the list associated with the current context. If set to 'Select a data list', it allows selecting a specific list. |
| `properties.appid` | `number` | no |  | properties | The AppID of the associated data source. (When properties.listtype is 'select') |
| `properties.listsetid` | `string` | no |  | properties | The ListSetID of the associated data source. (When properties.listtype is 'select') |
| `properties.listid` | `string` | no |  | properties | The ListID of the associated data source. (When properties.listtype is 'select') |
| `properties.type` | `enum` | no | `add`, `edit`, `remove` | properties | The operation type of the associated data source. (When properties.listtype is 'select') |
| `properties.listdatas` | `array` | no |  | properties | Configuration of data table column data.(When properties.type is 'add' or 'edit' or when properties.listtype is 'current') |
| `properties.wheres` | `array` | no |  | properties; op is 6/7)"},"showCus":{"type":"boolean","title":"Show Custom Config","description":"Whether to display custom configuration for this condition (optional field)"},"conditions":{"type":"array","title":"Nested Filter Conditions","description":"Sub-filter conditions nested under the current condition","items":{"$ref":"#/items"}}},"required":["pre","left","op"],"additionalProperties":false},"minItems":0,"uniqueItems":false} | A list of filter conditions for data filtering, supporting nested conditions(When properties.type is 'add' or 'edit') |

Nested schema notes:
- `properties.listdatas`: Configuration of data table column data.(When properties.type is 'add' or 'edit' or when properties.listtype is 'current')
- `properties.wheres`: A list of filter conditions for data filtering, supporting nested conditions(When properties.type is 'add' or 'edit')

## ConvertToPdf

- Control types: `ConvertToPdf`
- Support status: partially supported; requires document/template dependency validation
- Conditional: `properties.outputFileName.type`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.saveToVariable.prefix` | `enum` | no | `__variables_`, `__list_` |  | select the type of variable to save the result to. |
| `properties.saveToVariable.value` | `string` | no |  |  | select the variable id to save the result to.Only 'file' type variable is supported. |
| `properties.inputFiles` | `array` | no |  |  | Configuration for input file selection |
| `properties.outputFileName.value` | `array` | no |  |  | Yeeflow calculation expression to evaluate the value to pass.  |
| `properties.outputFileName.type` | `number` | no |  | properties | Fixed value 2 when properties.outputFileName.value is present, indicating that properties.outputFileName.value is an array from the expression editor. |

Nested schema notes:
- `properties.inputFiles`: Configuration for input file selection

## Delay

- Control types: `Delay`
- Support status: supported for structural validation
- Conditional: `properties.duration.count`, `properties.duration.unit`, `properties.until.subType`, `properties.until.specific.date`, `properties.until.specific.time`, `properties.until.dynamic.time`, `properties.condition.conditions`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.type` | `enum` | no | `duration`, `until`, `condition` |  | Specifies the type of delay logic. Required. |
| `properties.duration.count` | `string` | no |  | properties; Required when properties | The numeric value for the delay duration by a rich editor. Required when properties.type is 'duration'. |
| `properties.duration.unit` | `enum` | no | `Month`, `Week`, `Day`, `Hour`, `Minute`, `Second` | properties; Required when properties | The time unit for the delay duration. Required when properties.type is 'duration'. |
| `properties.until.subType` | `enum` | no | `specific`, `dynamic` | properties; Required when properties | Specifies the source type for the 'Until' date. (Required when properties.type is 'until') |
| `properties.until.specific.date` | `string` | no |  | properties; Required when properties | The specific date to wait until. (Required when properties.type is 'until' and properties.until.subType is 'specific') |
| `properties.until.specific.time` | `string` | no |  | properties; Required when properties | The specific time of day to wait until. (Required when properties.type is 'until' and properties.until.subType is 'specific') |
| `properties.until.specific.delayTime` | `string` | no |  |  | The actual delay time calculated from 'properties.until.specific.date' and 'properties.until.specific.time', converted to server time. |
| `properties.until.dynamic.time` | `string` | no |  | properties; Required when properties | Calculate the target date/time. Rich Text. Required when properties.type is 'until' and subType is 'dynamic'. |
| `properties.condition.conditions` | `array` | no |  | type is 1, this is the selected process variable; type is 2, this is the Yeeflow Calculation expression; type is 0, this is the fixed value | A list of conditions that must be satisfied for the workflow to proceed. |

Nested schema notes:
- `properties.condition.conditions`: A list of conditions that must be satisfied for the workflow to proceed.

## DocuSign

- Control types: `DocuSign`
- Support status: partially supported; external or credential-dependent and must not be bundled with sensitive values
- Conditional: `properties.sourceFile.type`, `properties.sourceFile.value`, `properties.templateId`, `properties.fieldMappings`, `properties.recipients`, `properties.subject`, `properties.html`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.connectionId` | `string` | no |  |  | The connection ID of the resource. |
| `properties.documentSource` | `enum` | no | `local`, `template` |  | The source of the document to sign. |
| `properties.sourceFile.type` | `enum` | no | `1`, `2` | properties | The type of the source file.(When properties.documentSource is 'local') |
| `properties.sourceFile.value` | `string` | no |  | properties | The value of the source file.(When properties.documentSource is 'local') |
| `properties.templateId` | `string` | no |  | properties | The ID of the template to use for signing.(When properties.documentSource is 'template') |
| `properties.fieldMappings` | `array` | no |  | properties | The field mappings to use for signing.(When properties.documentSource is 'template') |
| `properties.documentFolder` | `string` | no |  |  | The connection folder to use for signing |
| `properties.documentName` | `string` | no |  |  | The document name to use for signing. Rich Text Editor is supported. |
| `properties.ext` | `string` | no |  |  | The file extension to use for signing.Rich Text Editor is supported. |
| `properties.sendDocument` | `boolean` | no |  |  | Send the document to the signers for signing. |
| `properties.recipients` | `string` | no |  | properties | The recipients to use for signing. Rich Text Editor is supported.(When properties.sendDocument is true) |
| `properties.subject` | `string` | no |  | properties | Specifies the subject of the notification message.(When properties.sendDocument is true) |
| `properties.html` | `string` | no |  | properties | Specifies the body of the notification message.(When properties.sendDocument is true) |
| `properties.status.prefix` | `enum` | no | `__variables_`, `__list_` |  | select the type of variable to save the signed status to. |
| `properties.status.value` | `string` | no |  |  | select the variable id to save the signed status to.Only 'text' type variable is supported. |
| `properties.signedFile.prefix` | `enum` | no | `__variables_`, `__list_` |  | select the type of variable to save the signed file to. |
| `properties.signedFile.value` | `string` | no |  |  | select the variable id to save the signed file to.Only 'file' type variable is supported. |
| `properties.signedAuditTrail.prefix` | `enum` | no | `__variables_`, `__list_` |  | select the type of variable to save the signed audit trail to. |
| `properties.signedAuditTrail.value` | `string` | no |  |  | select the variable id to save the signed audit trail to.Only 'file' type variable is supported. |

## DocumentRecognition

- Control types: `DocumentRecognition`
- Support status: partially supported; external or credential-dependent and must not be bundled with sensitive values
- Conditional: `properties.modelType`, `properties.connectionId`, `properties.pageRange`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.inputFile.value` | `object` | no |  |  | If type is 1, it is a variable configuration with format {"exprType":"variable","valueType":"file","id":"Variable ID","type":"expr"}; if type is 2, it is a Yeeflow calculation expression. |
| `properties.inputFile.type` | `enum` | no | `1`, `2` |  | select the type of variable to save the result to. |
| `properties.serviceProvider` | `enum` | no | `in`, `azure` |  | Select the type of document to recognize. |
| `properties.modelType` | `enum` | no | `pre`, `custom` | properties | Select the type of model to use.(When properties.serviceType is 'in'.) |
| `properties.modelId` | `string` | no |  |  | The resource ID of the Azure AI Document Intelligence resource. |
| `properties.connectionId` | `string` | no |  | properties | The connection ID of the Azure AI Document Intelligence resource.(When properties.serviceType is 'azure', this field is required.) |
| `properties.rangeType` | `enum` | no | `all`, `range` |  | The range type of the document to recognize. |
| `properties.pageRange` | `number` | no |  | properties | The range of pages of the document to recognize.(When properties.rangeType is 'all', this value is 'all'.) |
| `properties.saveToVariable.prefix` | `enum` | no | `__variables_`, `__list_` |  | select the type of variable to save the result to. |
| `properties.saveToVariable.value` | `string` | no |  |  | select the variable id to save the result to.Only 'text' type variable is supported. |
| `properties.mappingFields` | `array` | no |  |  | Defines variable binding configuration, including name, type, and binding information |

Nested schema notes:
- `properties.mappingFields`: Defines variable binding configuration, including name, type, and binding information

## EndNoneEvent

- Control types: `EndNoneEvent`
- Support status: supported for structural validation
- Required: `properties.name`
- Conditional: `properties.from`, `properties.to`, `properties.cc`, `properties.subject`, `properties.files.list`, `properties.html`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | yes |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.isenabledemail` | `boolean` | no |  |  | Specifies whether to enable email notifications. DEFAULT is false. |
| `properties.from` | `enum` | no | `0`, `-1` | properties | Specifies the sender of the notification message.(When properties.isenabledemail is true) |
| `properties.to` | `string` | no |  | properties | Specifies the recipient of the notification message by a rich editor.(When properties.isenabledemail is true) |
| `properties.cc` | `string` | no |  | properties | Specifies the carbon copy recipient of the notification message by a rich editor.(When properties.isenabledemail is true) |
| `properties.subject` | `string` | no |  | properties | Specifies the subject of the notification message by a rich editor.(When properties.isenabledemail is true) |
| `properties.files.list` | `array` | no |  | list workflow task) | Specifies the file fields to be attached in the notification message.(When list workflow task) |
| `properties.files.variables` | `array` | no |  |  | Specifies the variables to be replaced in the notification message. |
| `properties.html` | `string` | no |  | properties | Specifies the content of the notification message by a rich editor.(When properties.isenabledemail is true) |
| `properties.endprocess` | `boolean` | no |  |  | Determines whether the process should be terminated immediately upon reaching this node. If set to true, the entire process instance ends, and all concurrent active activities are cancelled. DEFAULT is false. |

## EndRejectEvent

- Control types: `EndRejectEvent`
- Support status: supported for structural validation
- Required: `properties.name`
- Conditional: `properties.from`, `properties.to`, `properties.cc`, `properties.subject`, `properties.files.list`, `properties.html`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | yes |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.isenabledemail` | `boolean` | no |  |  | Specifies whether to enable email notifications. DEFAULT is false. |
| `properties.from` | `enum` | no | `0`, `-1` | properties | Specifies the sender of the notification message.(When properties.isenabledemail is true) |
| `properties.to` | `string` | no |  | properties | Specifies the recipient of the notification message by a rich editor.(When properties.isenabledemail is true) |
| `properties.cc` | `string` | no |  | properties | Specifies the carbon copy recipient of the notification message by a rich editor.(When properties.isenabledemail is true) |
| `properties.subject` | `string` | no |  | properties | Specifies the subject of the notification message by a rich editor.(When properties.isenabledemail is true) |
| `properties.files.list` | `array` | no |  | list workflow task) | Specifies the file fields to be attached in the notification message.(When list workflow task) |
| `properties.files.variables` | `array` | no |  |  | Specifies the variables to be replaced in the notification message. |
| `properties.html` | `string` | no |  | properties | Specifies the content of the notification message by a rich editor.(When properties.isenabledemail is true) |
| `properties.endprocess` | `boolean` | no |  |  | Determines whether the process should be terminated immediately upon reaching this node. If set to true, the entire process instance ends, and all concurrent active activities are cancelled. DEFAULT is false. |

## GenerateDocument

- Control types: `GenerateDocument`
- Support status: partially supported; requires document/template dependency validation
- Conditional: `properties.generateFileName.type`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.saveToVariable.prefix` | `enum` | no | `__variables_`, `__list_` |  | select the type of variable to save the result to. |
| `properties.saveToVariable.value` | `string` | no |  |  | select the variable id to save the result to.Only 'file' type variable is supported. |
| `properties.generateType` | `enum` | no | `pdf`, `word` |  | Set the document type to generate.  |
| `properties.templateFiles` | `array` | no |  |  | List of template file paths. Contains file information and file paths; file variables can also be bound to Variables of the current form. |
| `properties.generateFileName.value` | `array` | no |  |  | Yeeflow calculation expression to evaluate the value to pass.  |
| `properties.generateFileName.type` | `number` | no |  | properties | Fixed value 2 when properties.generateFileName.value is present, indicating that properties.generateFileName.value is an array from the expression editor. |

Nested schema notes:
- `properties.templateFiles`: List of template file paths. Contains file information and file paths; file variables can also be bound to Variables of the current form.

## HttpRequest

- Control types: `HttpRequest`
- Support status: partially supported; external or credential-dependent and must not be bundled with sensitive values
- Conditional: `properties.httpauth.attrs.user`, `properties.httpauth.attrs.pwd`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.httpaddress` | `string` | no |  |  | The HTTP address to send the request to. You can use the Rich Text Editor to configure the address. |
| `properties.httpMethod` | `enum` | no | `GET`, `PATCH`, `POST`, `PUT`, `DELETE` |  | The HTTP method to use for the request. |
| `properties.httpauth.type` | `enum` | no | `none`, `userpwd`, `yeeoffice` |  | The type of authentication to use for the request. |
| `properties.httpauth.attrs.user` | `string` | no |  | properties | The username to use for authentication.(When properties.httpauth.type is 'userpwd') |
| `properties.httpauth.attrs.pwd` | `string` | no |  | properties | The password to use for authentication.(When properties.httpauth.type is 'userpwd') |
| `properties.httpheader` | `string` | no |  |  | The HTTP headers to include in the request. You can use the Rich Text Editor to configure the headers. |
| `properties.httpdata` | `string` | no |  |  | The body of the request. You can use the Rich Text Editor to configure the body. |
| `properties.httpstatus` | `string` | no |  |  | The bound variable ID. Only number type is supported. |
| `properties.httpresult` | `string` | no |  |  | The bound variable ID. Support type text, list, dict. |

## InclusiveGateway

- Control types: `InclusiveGateway`
- Support status: supported for structural validation
- Required: `properties.name`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | yes |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |

## Loop

- Control types: `Loop`
- Support status: supported for structural validation
- Conditional: `properties.loopValue.type`, `properties.loopValue.value`, `properties.continueCondition`, `properties.breakCondition`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.loopType` | `enum` | no | `list`, `values`, `number` |  | Specifies the type of loop logic. |
| `properties.loopValue.prefix` | `enum` | no | `__variables_`, `__list_` |  | Set the type of variable to save the loop value. |
| `properties.loopValue.type` | `number` | no |  | properties | Data source type for the loop. When properties.loopType is 'values' or 'number', fixed as 2, indicating that properties.loopValue.value is a Yeeflow Calculation expression. When properties.loopType is 'list', the value should be ignored, as the list variable i |
| `properties.loopValue.value` | `string` | no |  | properties | Data source for the loop. When properties.loopType is 'list', this is a list type process variable. When properties.loopType is 'values', this is a Yeeflow Calculation expression that must return an array. When properties.loopType is 'number', this is a Yeeflo |
| `properties.continueCondition` | `string` | no |  | type is 1, this is the selected process variable; type is 2, this is the Yeeflow Calculation expression; type is 0, this is the fixed value | Process this iteration only if the condition is true; otherwise skip it and continue. |
| `properties.breakCondition` | `string` | no |  | true, stop the loop and continue to the next step; type is 1, this is the selected process variable; type is 2, this is the Yeeflow Calculation expression; type is 0, this is the fixed value | Check this before each iteration; when true, stop the loop and continue to the next step. |

Nested schema notes:
- `properties.continueCondition`: Process this iteration only if the condition is true; otherwise skip it and continue.
- `properties.breakCondition`: Check this before each iteration; when true, stop the loop and continue to the next step.

## LoopBreak

- Control types: `LoopBreak`
- Support status: supported for structural validation

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |

## MailTask

- Control types: `MailTask`
- Support status: supported for structural validation
- Conditional: `properties.files.list`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.from` | `enum` | no | `0`, `-1` |  | Specifies the sender of the notification message. |
| `properties.to` | `string` | no |  |  | Specifies the recipient of the notification message by a rich editor. |
| `properties.cc` | `string` | no |  |  | Specifies the carbon copy recipient of the notification message by a rich editor. |
| `properties.subject` | `string` | no |  |  | Specifies the subject of the notification message by a rich editor. |
| `properties.files.list` | `array` | no |  | list workflow task) | Specifies the file fields to be attached in the notification message.(When list workflow task) |
| `properties.files.variables` | `array` | no |  |  | Specifies the variables to be replaced in the notification message. |
| `properties.html` | `string` | no |  |  | Specifies the content of the notification message by a rich editor. |

Export-backed scheduled workflow note: `AI Agent and Copilot Local Resource Baseline8.yap` proves `MailTask` inside Scheduled Workflow graphs stores recipients in `properties.to`, subjects in `properties.subject`, and body HTML in `properties.html`. Subject/body may be expression-button HTML that references workflow variables. Fixed literal recipients must be treated as runtime-sensitive and redacted in documentation.

## MultiAssignmentTask

- Control types: `MultiAssignmentTask`
- Support status: supported for structural validation
- Required: `properties.name`
- Conditional: `properties.duedatedefinition`, `properties.duedateexpress`, `properties.isfromworkcalendar`, `properties.approvepercentage`, `properties.automaticapproveddefinition`, `properties.notifyrules`, `properties.from`, `properties.to`, `properties.cc`, `properties.subject`, `properties.files.list`, `properties.html`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | yes |  |  | Node Name |
| `properties.displayname` | `string` | no |  |  | The title or heading displayed at the top of a task form that is generated or initiated from a task list or workflow item. You can use the rich text editor to retrieve the task title. |
| `properties.usertaskassignment` | `array` | no |  |  | Defines the configuration for the Task assignee editor, supporting multiple selection methods and rich text |
| `properties.taskurl` | `string` | no |  |  | The URL of the task form that is generated or initiated from a task list or workflow item.  |
| `properties.tasktype` | `enum` | no | `approve`, `complete` |  | The type of task to be performed. If set to 'approve', 'Approve' and 'Reject' buttons will be displayed. If set to 'complete', a 'Complete' button will be displayed. |
| `properties.duedatetype` | `enum` | no | `hour`, `express`, `day`, `minute` |  | Specifies the due date type for the task. |
| `properties.duedatedefinition` | `number` | no |  | properties | Specifies the due date for the task. The format depends on the due date type. (When properties.duedatetype is hour, day, or minute). Important: This value is descriptive and does not support logic-based conditional checks for completion status. |
| `properties.duedateexpress` | `string` | no |  | properties | Specifies the express completion date for the task by a rich text editor. (When properties.duedatetype is express) |
| `properties.isfromworkcalendar` | `boolean` | no |  | properties | Specifies whether the express completion date is from the work calendar. (When properties.duedatetype is day) |
| `properties.disablequickapproval` | `boolean` | no |  |  | Specifies whether to disable quick approval.if false, the workflow task will allow direct task processing in notification message cards. |
| `properties.issequential` | `boolean` | no |  |  | Specifies whether the task is sequential. If set to true, the task is completed in sequence. If set to false, the task is completed in parallel. DEFAULT is false. |
| `properties.isallowreassign` | `boolean` | no |  |  | Specifies whether the task is reassignable. If set to true, the task can be reassigned to another user. If set to false, the task cannot be reassigned. DEFAULT is false. |
| `properties.isallowsign` | `boolean` | no |  |  | Specifies whether the task is signable. If set to true, the task can be signed by the assignee. If set to false, the task cannot be signed. DEFAULT is false. |
| `properties.approveway` | `enum` | no | `allapprove`, `anyprocess`, `anyapprove`, `anyreject`, `custompercentage` |  | Specifies whether the task is commentable. If set to true, the task can be commented on. If set to false, the task cannot be commented on. |
| `properties.approvepercentage` | `number` | no |  | properties | Set the percentage of approvers to approve the task.Number 0-100 (when properties.approveway is custompercentage) |
| `properties.allowskip` | `boolean` | no |  |  | Specifies whether the task is skippable. If set to false, the task can be skipped. If set to true, the task cannot be skipped. |
| `properties.automaticapproveddefinition` | `boolean` | no |  | the approver is the applicant or has approved the previous task | If set to true, automatically approve the current task when the approver is the applicant or has approved the previous task. |
| `properties.isallowrecalled` | `boolean` | no |  |  | Specifies whether the task is recallable. |
| `properties.notifyrules` | `array` | no |  | relative=1 or -1)"},"type":{"type":"string","enum":["day","hour","minute"],"description":"Set the offset type for the reminder time (when relative=1 or -1)"}},"additionalProperties":true,"description":"Action trigger time configuration"},"from":{"type":"string","enum":["0","-1"],"description":"Configure sender: -1 for system default sender, 0 for Yeeflow mail service (when actiontype=0)"},"to":{"type":"string","description":"Recipient configuration (when actiontype=0)"},"subject":{"type":"string","description":"Reminder subject (email subject/notification title), supports HTML and dynamic expressions (when actiontype=0)"},"content":{"type":"string","description":"If actiontype=1, values are Approved, Rejected (tasktype=complete, only Completed) | Defines the configuration of workflow task reminders after task due date, including email, notification, etc. |
| `properties.isenabledemail` | `boolean` | no |  |  | Specifies whether to enable email notifications. |
| `properties.from` | `enum` | no | `0`, `-1` | properties | Specifies the sender of the notification message.(When properties.isenabledemail is true) |
| `properties.to` | `string` | no |  | properties | Specifies the recipient of the notification message by a rich editor.(When properties.isenabledemail is true) |
| `properties.cc` | `string` | no |  | properties | Specifies the carbon copy recipient of the notification message by a rich editor.(When properties.isenabledemail is true) |
| `properties.subject` | `string` | no |  | properties | Specifies the subject of the notification message by a rich editor.(When properties.isenabledemail is true) |
| `properties.files.list` | `array` | no |  | list workflow task) | Specifies the file fields to be attached in the notification message.(When list workflow task) |
| `properties.files.variables` | `array` | no |  |  | Specifies the variables to be replaced in the notification message. |
| `properties.html` | `string` | no |  | properties | Specifies the content of the notification message by a rich editor.(When properties.isenabledemail is true) |

Nested schema notes:
- `properties.usertaskassignment`: Defines the configuration for the Task assignee editor, supporting multiple selection methods and rich text
- `properties.notifyrules`: Defines the configuration of workflow task reminders after task due date, including email, notification, etc.

## PandaDoc

- Control types: `PandaDoc`
- Support status: partially supported; external or credential-dependent and must not be bundled with sensitive values
- Conditional: `properties.sourceFile.type`, `properties.sourceFile.value`, `properties.templateId`, `properties.fieldMappings`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.connectionId` | `string` | no |  |  | Connection ID for PandaDoc integration. This field is required to establish a connection with the PandaDoc service. |
| `properties.documentSource` | `enum` | no | `local`, `template` |  | Specifies the source of the document to be processed. Options are 'local' (upload a file) or 'template' (use an existing PandaDoc template). This field is required. |
| `properties.sourceFile.type` | `enum` | no | `1`, `2` | 'properties; Required when 'properties | Source file type. 1 indicates File Variable, 2 indicates Expression. Required when 'properties.documentSource' is 'local'. |
| `properties.sourceFile.value` | `string` | no |  | properties; 'properties; Required when 'properties | Source file content. When properties.sourceFile.type is 1, this is a file type process variable. When properties.sourceFile.type is 2, this is a Yeeflow Calculation expression. Required when 'properties.documentSource' is 'local'. |
| `properties.templateId` | `string` | no |  | 'properties; Required when 'properties | The ID of the PandaDoc template to use. This field is required when 'properties.documentSource' is set to 'template'. It is hidden if 'properties.documentSource' is set to 'local'. |
| `properties.fieldMappings` | `array` | no |  | 'properties | Defines the variable mappings between the workflow data and the PandaDoc template fields. This configuration is visible and applicable only when 'properties.documentSource' is 'template' and a 'properties.templateId' is selected. |
| `properties.documentFolder` | `string` | no |  |  | Specifies the folder path or ID where the generated document should be stored in PandaDoc. |
| `properties.documentName` | `string` | no |  |  | Defines the name of the generated document by a rich editor. |
| `properties.ext` | `string` | no |  |  | Extended parameters for the PandaDoc API call, typically used for advanced configurations. Supports rich text. |
| `properties.sendDocument` | `boolean` | no |  |  | If set to true, the document will be sent immediately after generation. If false, it may be created as a draft. |
| `properties.recipients` | `string` | no |  |  | Specifies the recipients of the document by a rich editor. This field is required and defines who will receive the document for signing or viewing. |
| `properties.subject` | `string` | no |  |  | The subject line of the email sent to recipients by a rich editor. This field is required and supports rich text. |
| `properties.html` | `string` | no |  |  | The body content of the email sent to recipients by a rich editor. |
| `properties.status.prefix` | `enum` | no | `__variables_`, `__list_` |  | The type of the variable bound to the Signed Status (e.g., '__variables_'). |
| `properties.status.value` | `string` | no |  |  | The ID of the variable bound to the Signed Status. Only 'text' type variable is supported. |
| `properties.signedFile.prefix` | `enum` | no | `__variables_`, `__list_` |  | The type of the variable to save the signed file to (e.g., '__variables_'). |
| `properties.signedFile.value` | `string` | no |  |  | The ID of the variable to save the signed file to. Only 'file' type variable is supported. |

Nested schema notes:
- `properties.fieldMappings`: Defines the variable mappings between the workflow data and the PandaDoc template fields. This configuration is visible and applicable only when 'properties.documentSource' is 'template' and a 'properties.templateId' is selected.

## QueryData

- Control types: `QueryData`
- Support status: supported for structural validation
- Conditional: `properties.filters`, `properties.result.type`, `properties.result.listName`, `properties.result.listParent`, `properties.result.fields`, `properties.result.totalCount`, `properties.result.querycount_prefix`, `properties.result.pageIndex`, `properties.result.pageSize`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.appid` | `number` | no |  |  | The AppID of the associated data source.  |
| `properties.listsetid` | `string` | no |  |  | The ListSetID of the associated data source.  |
| `properties.listid` | `string` | no |  |  | The ListID of the associated data source.  |
| `properties.filters` | `array` | no |  | properties; op is 6/7)"},"showCus":{"type":"boolean","title":"Show Custom Config","description":"Whether to display custom configuration for this condition (optional field)"},"conditions":{"type":"array","title":"Nested Filter Conditions","description":"Sub-filter conditions nested under the current condition","items":{"$ref":"#/items"}}},"required":["pre","left","op"],"additionalProperties":false},"minItems":0,"uniqueItems":false} | A list of filter conditions for data filtering, supporting nested conditions(When properties.type is 'add' or 'edit') |
| `properties.datasource` | `array` | no |  |  | Defines the sorting rules for data. |
| `properties.result.type` | `enum` | no | `single`, `multiple` | properties | The type of the result. (When properties.listsetid has value) |
| `properties.result.fieldMap` | `object` | no |  |  | The mapping of field names in the result set to the desired output field names. eg: {"ListDataID":"field_4","Title":"field_1"} |
| `properties.result.listName` | `string` | no |  | properties | The specific variable or field ID to store the multi-select results. Only fields of type 'text'(list workflow:textarea) and 'list' are supported. (When properties.result.type is 'multiple') |
| `properties.result.listParent` | `enum` | no | `__variables_`, `__list_` | properties | Defines where to store the multi-select results(When properties.result.type is 'multiple'). Choose between standard workflow variables or specific fields from the associated records in a list workflow. |
| `properties.result.fields` | `array` | no |  | properties | Field assignment configuration for query results (When properties.result.type is 'multiple' and the selected field in properties.result.listName is of type text) |
| `properties.result.vartype` | `enum` | no | `text`, `list` |  | The type of the variable specified in properties.result.listName.  |
| `properties.result.totalCount` | `string` | no |  | properties | Save the result count to a variable. (When properties.result.type is 'multiple') |
| `properties.result.querycount_prefix` | `enum` | no | `__variables_`, `__list_` | properties | The prefix of the variable id to store the total count. (When properties.result.type is 'multiple') |
| `properties.result.pageIndex` | `number` | no |  | properties | Data index to be queried. (When properties.result.type is 'multiple') |
| `properties.result.pageSize` | `number` | no |  | properties | Data count per query. (When properties.result.type is 'multiple') |

Nested schema notes:
- `properties.filters`: A list of filter conditions for data filtering, supporting nested conditions(When properties.type is 'add' or 'edit')
- `properties.datasource`: Defines the sorting rules for data.
- `properties.result.fields`: Field assignment configuration for query results (When properties.result.type is 'multiple' and the selected field in properties.result.listName is of type text)

Export-backed scheduled workflow note: `AI Agent and Copilot Local Resource Baseline8.yap` proves `QueryData` can target a local app data list from a Scheduled Workflow and save a multiple-result JSON payload into a text workflow variable by using `result.listParent = "__variables_"`, `result.listName`, `result.vartype = "text"`, and `result.fields[]`. The total count can be saved with `result.totalCount` and `result.querycount_prefix = "__variables_"`.

## ResponseTo

- Control types: `ResponseTo`
- Support status: supported for structural validation

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |

## SequenceFlow

- Control types: `SequenceFlow`
- Support status: supported for structural validation
- Required: `properties.name`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | yes |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.conditioninfo` | `array` | no |  |  | Defines the logic conditions for the Sequence Flow. The workflow engine evaluates these conditions to determine if the path should be taken. It supports nested conditions for complex logic. |

Nested schema notes:
- `properties.conditioninfo`: Defines the logic conditions for the Sequence Flow. The workflow engine evaluates these conditions to determine if the path should be taken. It supports nested conditions for complex logic.

## SetVariableTask

- Control types: `SetVariableTask`
- Support status: supported for structural validation
- Conditional: `properties.data.AppID`, `properties.data.ListSetID`, `properties.data.ProcKey`, `properties.formids`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.formtype` | `enum` | no | `current`, `custom` |  | Specifies the workflow type. If 'custom' is selected, another workflow must be specified. |
| `properties.data.AppID` | `number` | no |  | properties | The AppID of the associated data source. (When properties.formtype is 'custom') |
| `properties.data.ListSetID` | `string` | no |  | properties | The ListSetID of the associated data source. (When properties.formtype is 'custom') |
| `properties.data.ProcKey` | `string` | no |  | properties | The ProcKey of the associated data source. (When properties.formtype is 'custom') |
| `properties.formids` | `string` | no |  | properties | Form for setting variables by a rich editor. (When properties.formtype is 'custom') |
| `properties.variablesetting` | `array` | no |  |  | Set the value of Variables |

Nested schema notes:
- `properties.variablesetting`: Set the value of Variables

## SignalEvent

- Control types: `SignalEvent`
- Support status: supported for structural validation
- Conditional: `properties.eventdefinitions`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.eventdefinitions` | `array` | no |  | the application is either Canceled by a submitter or Recalled by the initiator | Defines which workflow actions will trigger this signal. You can select multiple triggers. The event fires when the application is either Canceled by a submitter or Recalled by the initiator. |

Nested schema notes:
- `properties.eventdefinitions`: Defines which workflow actions will trigger this signal. You can select multiple triggers. The event fires when the application is either Canceled by a submitter or Recalled by the initiator.

## StartNoneEvent

- Control types: `StartNoneEvent`
- Support status: supported for structural validation
- Required: `properties.name`
- Conditional: `properties.terminate-conditions`, `properties.revoke-conditions`, `properties.from`, `properties.to`, `properties.cc`, `properties.subject`, `properties.files.list`, `properties.html`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | yes |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.taskurl` | `string` | no |  |  | The ID of the submission form. Only supported in approval workflow. |
| `properties.terminate` | `boolean` | no |  |  | Allow Terminate. Default is false. Only supported in approval workflow.If false, the workflow can be terminated by the user. |
| `properties.terminate-conditions` | `array` | no |  | properties; type is 1, this is the selected Custom variable(MUST follow the same reference format as in SequenceFlow conditions); type is 2, this is the Yeeflow Calculation expression; type is 0, this is the fixed value | Conditions to allow termination. Not supported in List Workflow.(When properties.terminate is false). |
| `properties.revoke` | `boolean` | no |  |  | Allow Recall. Default is false. Only supported in approval workflow.If false, the workflow can be recalled by the user. |
| `properties.revoke-conditions` | `array` | no |  | properties; type is 1, this is the selected process variable; type is 2, this is the Yeeflow Calculation expression; type is 0, this is the fixed value | Conditions to allow recall. Not supported in List Workflow.(When properties.revoke is false). |
| `properties.isenabledemail` | `boolean` | no |  |  | Specifies whether to enable email notifications. DEFAULT is false. |
| `properties.from` | `enum` | no | `0`, `-1` | properties | Specifies the sender of the notification message.(when properties.isenabledemail is true) |
| `properties.to` | `string` | no |  | properties | Specifies the recipient of the notification message by a rich editor.(when properties.isenabledemail is true) |
| `properties.cc` | `string` | no |  | properties | Specifies the carbon copy recipient of the notification message by a rich editor.(when properties.isenabledemail is true) |
| `properties.subject` | `string` | no |  | properties | Specifies the subject of the notification message by a rich editor.(when properties.isenabledemail is true) |
| `properties.files.list` | `array` | no |  | list workflow task) | Specifies the file fields to be attached in the notification message.(When list workflow task) |
| `properties.files.variables` | `array` | no |  |  | Specifies the variables to be replaced in the notification message. |
| `properties.html` | `string` | no |  | properties | Specifies the content of the notification message by a rich editor.(when properties.isenabledemail is true) |

Nested schema notes:
- `properties.terminate-conditions`: Conditions to allow termination. Not supported in List Workflow.(When properties.terminate is false).
- `properties.revoke-conditions`: Conditions to allow recall. Not supported in List Workflow.(When properties.revoke is false).

## StartWorkflowTask

- Control types: `StartWorkflowTask`
- Support status: supported for structural validation
- Conditional: `properties.itemtype`, `properties.applicantuser`, `properties.itemids.value`, `properties.itemids.type`

| Path | Type | Required | Enum Values | Applies When | Description |
| --- | --- | --- | --- | --- | --- |
| `properties.name` | `string` | no |  |  | Node Name |
| `properties.documentation` | `string` | no |  |  | Node description |
| `properties.workflowtype` | `enum` | no | `1`, `2` |  | The type of the workflow to start. |
| `properties.data.AppID` | `number` | no |  |  | The AppID of the associated data source. If properties.workflowtype is '2' and properties.itemtype is '1', AppID is the AppID of the current list. |
| `properties.data.ListSetID` | `string` | no |  |  | The ListSetID of the associated data source. If properties.workflowtype is '2' and properties.itemtype is '1', ListSetID is the ListSetID of the current list. |
| `properties.data.ProcKey` | `string` | no |  |  | The ProcKey of the associated data source. If properties.workflowtype is '2' and properties.itemtype is '1', ProcKey is the ProcKey of the current list. |
| `properties.data.ListID` | `string` | no |  |  | The ListID of the associated data source. If properties.workflowtype is '2' and properties.itemtype is '1', ListID is the ListID of the current list. |
| `properties.itemtype` | `enum` | no | `1`, `2` | properties | Specifies the data item type. If properties.itemtype is '2', a data item must be specified.(When properties.workflowtype is '2') |
| `properties.variablesetting` | `array` | no |  |  | Set the value of Variables |
| `properties.applicantuser` | `string` | no |  | executing this workflow through the rich text editor | Set the user identity used when executing this workflow through the rich text editor |
| `properties.fallbackuser` | `string` | no |  |  | Select a fallback user( User ID) to run this workflow if the selected user is unavailable. |
| `properties.itemids.value` | `array` | no |  | properties | yeeflow calculation expression to get the data item IDs to be processed. (When properties.itemtype is '2') |
| `properties.itemids.type` | `number` | no |  | properties | Fixed value 2 when properties.itemids.value is present, indicating that properties.itemids.value is an array from the expression editor. |

Nested schema notes:
- `properties.variablesetting`: Set the value of Variables
