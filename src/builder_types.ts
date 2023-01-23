import {
  FieldNode,
  NameNode,
  Kind,
  DocumentNode,
  OperationDefinitionNode,
  OperationTypeNode,
  SelectionSetNode,
  SelectionNode,
} from "graphql";
import {
  ScalarTypeDefinition,
  InputValueDefinition,
  EnumTypeDefinition,
  ArgumentsDefinition,
  ObjectTypeDefinition,
} from "./schema_types";

export class ScalarBuilder<
  T extends ScalarTypeDefinition,
  Name extends string,
  Alias extends string | undefined
> {
  public _alias: Alias = undefined as Alias;

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

type GetInputTypes<T extends InputValueDefinition> =
  T["type"] extends ScalarTypeDefinition
    ? T["type"]["input"]
    : T["type"] extends EnumTypeDefinition
    ? T["type"]["values"]
    : never;

type GetArgsFromDefinition<T extends ArgumentsDefinition> = {
  [K in keyof T]: GetInputTypes<T[K]>;
};

export class ObjectBuilder<
  T extends ObjectTypeDefinition,
  Name extends string,
  Alias extends string | undefined,
  Args extends any,
  SubBuilders extends Array<Builder>
> {
  constructor(public name: Name) {}

  public _alias: Alias = undefined as Alias;
  public args: Args = {} as any;
  public subBuilders: SubBuilders = [] as any;

  alias<Alias extends string>(
    name: Alias
  ): ObjectBuilder<T, Name, Alias, any, SubBuilders> {
    this._alias = name as any;
    return this as any;
  }

  fields<Result extends Array<Builder>>(
    cb: (q: {
      [K in keyof T["fields"]]: <
        Args extends GetArgsFromDefinition<NonNullable<T["fields"][K]["args"]>>
      >(
        ...args: T["fields"][K]["args"] extends ArgumentsDefinition
          ? [args: ($: any) => Args]
          : []
      ) => ExtractDefinitionFromType<T["fields"][K]["type"]> extends infer Inner
        ? Inner extends ObjectTypeDefinition
          ? ObjectBuilder<
              Inner,
              K extends string ? K : never,
              undefined,
              Args,
              []
            >
          : Inner extends ScalarTypeDefinition
          ? ScalarBuilder<Inner, K extends string ? K : never, undefined>
          : never
        : never;
    }) => Result
  ): ObjectBuilder<T, Name, Alias, Args, Result> {
    const proxy = new Proxy(
      {},
      {
        get: (_, property: string) => {
          const builder = new ObjectBuilder(property);
          this.subBuilders.push(builder);
          return () => builder;
        },
      }
    );
    cb(proxy as any);
    return this as any;
  }

  build(): SelectionSetNode {
    const selections: SelectionNode[] = [];

    for (const builder of this.subBuilders) {
      if (builder instanceof ObjectBuilder) {
        let selectionSet: SelectionSetNode | undefined = builder.build();
        if (selectionSet.selections.length === 0) {
          selectionSet = undefined;
        }
        let alias: NameNode | undefined = undefined;
        if (builder._alias) {
          alias = {
            kind: Kind.NAME,
            value: builder._alias,
          };
        }
        selections.push({
          kind: Kind.FIELD,
          name: {
            kind: Kind.NAME,
            value: builder.name,
          },
          alias,
          selectionSet,
        });
      }
    }

    return {
      kind: Kind.SELECTION_SET,
      selections,
    };
  }
}

export class DocumentBuilder<
  Operations extends Record<string, ObjectBuilder<any, any, any, any, any>>,
  Schema extends ObjectTypeDefinition
> {
  operations: Operations = {} as Operations;

  addQuery<Name extends string, Result>(
    query: Name,
    cb: (q: ObjectBuilder<Schema, any, any, any, any>) => Result
  ): DocumentBuilder<Operations & { [K in Name]: Result }, Schema> {
    const builder = new ObjectBuilder<any, any, any, any, any>("root");
    this.operations[query] = builder as any;
    cb(builder as any);
    return this as any;
  }

  build(): DocumentNode {
    const definitions: OperationDefinitionNode[] = [];

    for (const [k, v] of Object.entries(this.operations)) {
      definitions.push({
        kind: Kind.OPERATION_DEFINITION,
        operation: OperationTypeNode.QUERY,
        selectionSet: v.build(),
      });
    }

    return {
      kind: Kind.DOCUMENT,
      definitions,
    };
  }
}

type Builder =
  | ObjectBuilder<any, any, any, any, any>
  | ScalarBuilder<any, any, any>;

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

type BuilderName<B extends Builder> = B extends ObjectBuilder<
  any,
  infer Name,
  any,
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
  any,
  any
>
  ? Alias
  : B extends ScalarBuilder<any, any, infer Alias>
  ? Alias
  : never;

export type ResultFromOperation<B extends Builder | DocumentBuilder<any, any>> =
  B extends DocumentBuilder<infer Operations, any>
    ? ResultFromOperation<Operations[keyof Operations]>
    : B extends ObjectBuilder<
        infer T,
        infer Name,
        infer Alias,
        infer Args,
        infer SubBuilders
      >
    ? ComputeObj<
        SubBuilders[number] extends infer SubBuilder
          ? SubBuilder extends Builder
            ? {
                [K in ResolveKey<
                  BuilderAlias<SubBuilder>,
                  BuilderName<SubBuilder>
                >]: CloneModifiers<
                  T["fields"][K]["type"],
                  ResultFromOperation<SubBuilder>
                >;
              }
            : never
          : never
      >
    : B extends ScalarBuilder<infer T, any, any>
    ? T["output"]
    : never;
