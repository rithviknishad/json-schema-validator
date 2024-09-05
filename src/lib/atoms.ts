import { atomWithStorage } from "jotai/utils";

type AppState = {
  schema: string;
  tests: string[];
};

export const appStateAtom = atomWithStorage<AppState>(
  "json-schema-validator-app-state",
  {
    schema: `
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "array",
    "items": [
        {
            "type": "object",
            "properties": {
                "name": {
                    "enum": [
                        "Adrenalin",
                        "Nor-adrenalin",
                        "Vasopressin",
                        "Dopamine",
                        "Dobutamine"
                    ]
                },
                "quantity": {
                    "type": "number",
                    "minimum": 0
                }
            },
            "additionalProperties": false,
            "required": ["name", "quantity"]
        }
    ]
}
  `,
    tests: [
      `[
  {
    "name": "Dopamine",
    "quantity": 0
  }
]`,
      `[
  {
    "name": "Something not in the list",
    "quantity": 0
  }
]`,
      "gibberish",
    ],
  }
);
