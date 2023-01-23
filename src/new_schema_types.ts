export type Conform<Expected, Input> = Input extends Expected ? Input : never;

export type ScalarTypeDefinition = {
  name: string;
  output: any;
  input: any;
};

export type ObjectTypeDefinition = {
  name: string;
  implements?: any | undefined;
  fields: Record<
    string,
    {
      args?: ArgumentsDefinition;
      type: Type<TypeDefinition>;
    }
  >;
};

export type InterfaceTypeDefinition = {
  name: string;
  implements: InterfaceTypeDefinition[];
  fields: Record<
    string,
    {
      args: ArgumentsDefinition;
      type: TypeDefinition;
    }
  >;
};

export type UnionTypeDefinitionDef = {
  name: string;
  types: TypeDefinition[];
};

export type UnionTypeDefinition = {
  name: string;
  types: TypeDefinition[];
};

export type EnumTypeDefinition = {
  name: string;
  values: string;
};

export type InputObjectTypeDefinition = {
  name: string;
  fields: Record<string, InputFieldDefinition>;
};

export type TypeDefinition =
  | ScalarTypeDefinition
  | UnionTypeDefinition
  | InterfaceTypeDefinition
  | ObjectTypeDefinition
  | EnumTypeDefinition
  | InputFieldDefinition;

export type InputTypeDefinition =
  | ScalarTypeDefinition
  | EnumTypeDefinition
  | InputFieldDefinition;

export type Type<T extends TypeDefinition> = Array<Type<T>> | T | null;

export type InputFieldDefinition = {
  type: Type<any>;
};

export type ArgumentsDefinition = Record<string, InputValueDefinition>;

export type InputValueDefinition = {
  type: InputTypeDefinition;
};

export type SchemaDefinition<
  Query extends ObjectTypeDefinition,
  Mutation extends ObjectTypeDefinition = never,
  Subscription extends ObjectTypeDefinition = never
> = {
  query: Query;
  mutation: Mutation;
  subscription: Subscription;
};
