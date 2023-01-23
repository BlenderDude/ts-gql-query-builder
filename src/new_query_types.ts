import { Query } from "./new_schema";
import {
  ObjectTypeDefinition,
  TypeDefinition,
  UnionTypeDefinition,
} from "./new_schema_types";

type OperationType = "query" | "mutation" | "subscription";

export type Field<
  T extends ObjectTypeDefinition,
  Key extends keyof T["fields"]
> = {
  alias?: string;
  name: Key;
  selectionSet: SelectionSet<
    T["fields"][Key]["type"] extends infer Def extends
      | ObjectTypeDefinition
      | UnionTypeDefinition
      ? Def
      : never
  >;
  object: T;
};

export type SelectionSet<T extends ObjectTypeDefinition | UnionTypeDefinition> =
  T extends ObjectTypeDefinition ? Field<T, keyof T["fields"]> : never;

export type OperationDefinition<T extends ObjectTypeDefinition> = {
  object: T;
  type: OperationType;
  selectionSet: SelectionSet<T>;
};
