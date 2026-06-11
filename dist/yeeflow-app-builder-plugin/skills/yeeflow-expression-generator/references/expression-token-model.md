# Expression Token Model

Expressions are JSON arrays of Yeeflow tokens.

- string: `{ "type": "str", "value": "abc" }`
- number: `{ "type": "num", "value": "123" }`
- boolean: `{ "type": "bool", "value": true }`
- operator: `{ "type": "op", "op": "+" }`
- function: `{ "type": "func", "func": "now", "params": [] }`
- variable: `{ "exprType": "variable", "valueType": "number", "id": "Amount", "type": "expr", "name": "Workflow Variables:Amount" }`

Allowed variable value types are `number`, `text`, `date`, and `boolean`.
