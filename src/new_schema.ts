import {
  Conform,
  ObjectTypeDefinition,
  ScalarTypeDefinition,
  SchemaDefinition,
} from "./new_schema_types";

type ID = Conform<
  ScalarTypeDefinition,
  {
    name: "ID";
    output: string;
    input: string;
  }
>;

type String = Conform<
  ScalarTypeDefinition,
  {
    name: "String";
    output: string;
    input: string;
  }
>;

type User = Conform<
  ObjectTypeDefinition,
  {
    name: "User";
    fields: {
      id: {
        type: ID;
      };
      name: {
        type: String;
      };
    };
  }
>;

export type Query = Conform<
  ObjectTypeDefinition,
  {
    name: "Query";
    fields: {
      user: {
        args: {
          id: { type: String };
        };
        type: User | null;
      };
      users: {
        args: {
          id: { type: String };
        };
        type: User[];
      };
    };
  }
>;

export type Schema = SchemaDefinition<Query>;
