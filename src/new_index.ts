import { FieldNode, Kind, NameNode } from "graphql";

const f: FieldNode = {
  kind: Kind.FIELD,
  name: {
    kind: Kind.NAME,
    value: "",
  },
};

import { Schema } from "./new_schema";
import {
  ObjectTypeDefinition,
  ScalarTypeDefinition,
  SchemaDefinition,
} from "./new_schema_types";

class ScalarBuilder<
  T extends ScalarTypeDefinition,
  Name extends string,
  Alias extends string | undefined
> {
  private _alias: Alias = undefined as Alias;

  constructor(public name: Name) {}

  alias<Alias extends string>(alias: Alias): ScalarBuilder<T, Name, Alias> {
    this._alias = alias as any;
    return this as any;
  }

  build(): FieldNode {
    let alias: NameNode | undefined = undefined;
    if (this._alias) {
      alias = {
        kind: Kind.NAME,
        value: this._alias,
      };
    }
    return {
      kind: Kind.FIELD,
      name: {
        kind: Kind.NAME,
        value: this.name,
      },
      alias,
    };
  }
}

type ExtractDefinitionFromType<T> = Exclude<
  T extends Array<infer E> ? ExtractDefinitionFromType<E> : T,
  null
>;

// type Test2134 = ExtractDefinitionFromType<Array<number | null> | null>;

class ObjectBuilder<
  T extends ObjectTypeDefinition,
  Name extends string,
  Alias extends string | undefined,
  SelectionSet extends Array<Builder>
> {
  constructor(public name: Name) {}

  private _alias: Alias = undefined as Alias;
  private selectionSet: SelectionSet = [] as any;

  alias<Alias extends string>(
    name: Alias
  ): ObjectBuilder<T, Name, Alias, SelectionSet> {
    this._alias = name as any;
    return this as any;
  }

  fields<Result extends Array<Builder>>(
    cb: (q: {
      [K in keyof T["fields"]]: ExtractDefinitionFromType<
        T["fields"][K]["type"]
      > extends infer Inner
        ? Inner extends ObjectTypeDefinition
          ? ObjectBuilder<Inner, K extends string ? K : never, undefined, []>
          : Inner extends ScalarTypeDefinition
          ? ScalarBuilder<Inner, K extends string ? K : never, undefined>
          : never
        : never;
    }) => Result
  ): ObjectBuilder<T, Name, Alias, Result> {
    return "" as any;
  }
}

type Builder = ObjectBuilder<any, any, any, any> | ScalarBuilder<any, any, any>;

type ResolveKey<Alias, Name> = Alias extends string
  ? Alias
  : Name extends string
  ? Name
  : never;

type AllKeys<T> = T extends unknown ? keyof T : never;
type Compute<T> = [T] extends unknown ? T : never;
type ComputeObj<T> = {
  [K in AllKeys<T>]: T extends unknown
    ? K extends keyof T
      ? T[K]
      : never
    : never;
} & unknown;

type CloneModifiers<Source, Destination> = Source extends Array<infer E>
  ? Array<CloneModifiers<E, Destination>>
  : Source extends null
  ? null
  : Destination;

type BuilderKeys<B extends Builder> = B extends ObjectBuilder<
  any,
  infer Name,
  infer Alias,
  any
>
  ? ResolveKey<Alias, Name>
  : B extends ScalarBuilder<any, infer Name, infer Alias>
  ? ResolveKey<Alias, Name>
  : never;

type BuilderName<B extends Builder> = B extends ObjectBuilder<
  any,
  infer Name,
  any,
  any
>
  ? Name
  : B extends ScalarBuilder<any, infer Name, any>
  ? Name
  : never;

type BuilderAlias<B extends Builder> = B extends ObjectBuilder<
  any,
  any,
  infer Alias,
  any
>
  ? Alias
  : B extends ScalarBuilder<any, any, infer Alias>
  ? Alias
  : never;

type NormalizeBuilders<B extends Builder> = {
  name: BuilderName<B>;
  alias: BuilderAlias<B>;
  builder: B;
};

type ResultFromOperation2<B extends Builder> = B extends "never"
  ? ""
  : B extends ObjectBuilder<infer T, infer Name, infer Alias, infer SubBuilders>
  ? ComputeObj<
      SubBuilders[number] extends infer SubBuilder
        ? SubBuilder extends Builder
          ? {
              [K in ResolveKey<
                BuilderAlias<SubBuilder>,
                BuilderName<SubBuilder>
              >]: CloneModifiers<
                T["fields"][K]["type"],
                ResultFromOperation2<SubBuilder>
              >;
            }
          : never
        : never
    >
  : B extends ScalarBuilder<infer T, any, any>
  ? T["output"]
  : never;

type Res2 = ResultFromOperation2<typeof result>;

type ResultFromOperation<B extends Builder> = ComputeObj<
  B extends ObjectBuilder<infer Type, infer Name, infer Alias, infer Builders>
    ? {
        [K in ResolveKey<Alias, Name>]: ComputeObj<
          Builders[number] extends infer InnerBuilder extends Builder
            ? InnerBuilder extends ObjectBuilder<any, infer Name, any, any>
              ? CloneModifiers<
                  Type["fields"][Name]["type"],
                  Compute<ResultFromOperation<InnerBuilder>>
                >
              : Compute<ResultFromOperation<InnerBuilder>>
            : never
        >;
      }
    : B extends ScalarBuilder<infer Type, infer Name, infer Alias>
    ? {
        [K in ResolveKey<Alias, Name>]: Type["output"];
      }
    : never
>;

function makeTSGQL<
  OperationType extends "query" | "mutation",
  Schema extends SchemaDefinition<any>
>(): () => ObjectBuilder<Schema[OperationType], "root", undefined, []> {
  return "" as any;
}

const tsgql = makeTSGQL<"query", Schema>();

const result = tsgql().fields((q) => [
  //
  q.user.fields((q) => [
    //
    q.id,
    q.name.alias("nameAlias"),
  ]),
  q.users.fields((q) => [
    //
    q.id,
    q.name,
  ]),
]);

type Res = ResultFromOperation<typeof result>;
type Test = Res["root"];
