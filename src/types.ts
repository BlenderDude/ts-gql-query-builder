export type GQLScalar<Name extends string, Output, Input = Output> = {
  name: Name;
  input: Input;
  output: Output;
};

export type GQLType<
  Name extends string,
  Shape extends Record<
    string,
    {
      isNullable?: true;
      isList?: true;
      isListElementNullable?: true;
      args?: GQLArgs<any>;
    } & (
      | {
          type: GQLType<any, any>;
        }
      | {
          scalar: GQLScalar<any, any>;
        }
    )
  >
> = Shape & {
  __typename: Name;
};

export type GQLSchema<Query, Mutation, Subscription> = {
  Query: Query;
  Mutation: Mutation;
  Subscription: Subscription;
};

type GQLOperationType = "Query" | "Mutation" | "Subscription";

type FieldMetaFromType<T> = {
  isList: T extends any[] ? true : false;
  isNullable: T extends null ? true : false;
};

type NormalizeType<T> = T extends Array<infer E>
  ? NormalizeType<E>
  : T extends null
  ? NonNullable<T>
  : T;

export class GQLArgs<Args> {}
export class GQLDirectives {}

interface GQLFieldDef<T extends GQLType<any, any>> {
  alias: string | undefined;
  name: keyof T;
  args: GQLArgs<any>;
  directives: GQLDirectives;
  selectionSet?: GQLSelectionSet;
}

export class GQLField<
  Type extends GQLType<any, any>,
  Def extends GQLFieldDef<Type>
> {
  alias: Def["alias"];
  name: Def["name"];
  args: Def["args"];
  selectionSet?: Def["selectionSet"];

  constructor(def: GQLFieldDef<Type>) {
    this.alias = def.alias;
    this.name = def.name;
    this.args = def.args;
    this.selectionSet = def.selectionSet;
  }
}

export class GQLFragmentSpread<
  Type extends GQLType<any, any>,
  SelectionSet extends GQLSelectionSet
> {
  constructor(public selectionSet: GQLSelectionSet) {}
}

export class GQLInlineFragment<
  Type extends GQLType<any, any>,
  SelectionSet extends GQLSelectionSet
> {
  constructor(public selectionSet: GQLSelectionSet) {}
}

type GQLSelectionSet = ReadonlyArray<GQLSelection>;

type GQLSelection = GQLField<any, any>;

interface GQLOperationDef {
  name: string;
  type: GQLOperationType;
  selectionSet: GQLSelectionSet;
}

export class GQLOperation<
  Schema extends GQLSchema<any, any, any>,
  Def extends GQLOperationDef
> {
  constructor(def: Def) {}
}

type SelectionSetBuilderParams<
  Type extends GQLType<any, any>[string],
  Alias extends string | undefined,
  SelectionSetResult extends GQLSelectionSet
> = Type extends { type: infer SubType }
  ? [
      options: {
        alias?: Alias;
      },
      builder: SelectionSetBuilder<SubType, SelectionSetResult>
    ]
  : [
      options?: {
        alias?: Alias;
      }
    ];

type SelectionSetBuilder<
  Type extends GQLType<any, any>,
  Result extends GQLSelectionSet
> = (builder: {
  [K in keyof Type]: <
    SelectionSetResult extends GQLSelectionSet,
    Alias extends string | undefined
  >(
    ...args: SelectionSetBuilderParams<Type[K], Alias, SelectionSetResult>
  ) => GQLField<
    Type,
    {
      alias: Alias;
      args: any;
      directives: any;
      name: K;
      selectionSet: SelectionSetResult;
    }
  >;
}) => Result;

export function makeTSGQL<Schema extends GQLSchema<any, any, any>>() {
  return <
    Name extends string,
    Type extends GQLOperationType,
    Result extends GQLSelectionSet
  >(
    name: Name,
    type: Type,
    builder: SelectionSetBuilder<Schema[Type], Result>
  ): GQLOperation<
    Schema,
    {
      name: Name;
      type: Type;
      selectionSet: Result;
    }
  > => {
    return {} as any;
  };
}

type Compute<T> = T extends unknown ? T : never;

type AllKeys<T> = T extends unknown ? keyof T : never;

type Combine<T> = Compute<{
  [K in AllKeys<T>]: T extends unknown
    ? K extends keyof T
      ? T[K]
      : never
    : never;
}>;

type ResultKeyFromField<T extends GQLField<any, any>> = T extends GQLField<
  any,
  infer Def
>
  ? Def["alias"] extends string
    ? Def["alias"]
    : Def["name"]
  : never;

type NullabilityModifierFromField<
  T extends GQLField<any, any>,
  Value
> = T extends GQLField<infer Type, infer Def>
  ? Type[Def["name"]] extends { isNullable: true }
    ? Value | null
    : Value
  : never;

type ListModifierFromField<
  T extends GQLField<any, any>,
  Value
> = T extends GQLField<infer Type, infer Def>
  ? Type[Def["name"]] extends { isList: true; isListElementNullable: true }
    ? Array<Value | null>
    : Type[Def["name"]] extends { isList: true }
    ? Array<Value>
    : Value
  : never;

type ResultTypeFromField<T extends GQLField<any, any>> = T extends GQLField<
  infer Type,
  infer Def
>
  ? Type[Def["name"]] extends {
      scalar: GQLScalar<any, infer Output>;
    }
    ? Output
    : Def["selectionSet"] extends GQLSelectionSet
    ? ResultFromSelectionSet<Def["selectionSet"]>
    : never
  : never;

type ResultFromSelection<T> = Compute<
  Combine<
    T extends GQLField<infer Type, infer Def>
      ? {
          [K in ResultKeyFromField<T>]: NullabilityModifierFromField<
            T,
            ListModifierFromField<T, ResultTypeFromField<T>>
          >;
        }
      : never
  >
>;

type ResultFromSelectionSet<Set extends GQLSelectionSet> = Compute<
  ResultFromSelection<Set[number]>
>;

export type ResultFromOperation<Op extends GQLOperation<any, any>> =
  Op extends GQLOperation<infer Schema, infer Def>
    ? ResultFromSelectionSet<Def["selectionSet"]>
    : never;
