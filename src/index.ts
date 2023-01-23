import { Schema } from "./schema";
import { SchemaDefinition } from "./schema_types";
import {
  DocumentBuilder,
  ObjectBuilder,
  ResultFromOperation,
} from "./builder_types";
import { parse, print, validate } from "graphql";

function makeTSGQL<
  OperationType extends "query" | "mutation",
  Schema extends SchemaDefinition<any>
>(): () => DocumentBuilder<{}, Schema[OperationType]> {
  return () => {
    return new DocumentBuilder();
  };
}

const tsgql = makeTSGQL<"query", Schema>();

const query = tsgql().addQuery("test", (q) =>
  q.fields((q) => [
    //
    q
      .user(($) => ({
        id: "test",
      }))
      .fields((q) => [
        //
        q.id(),
        q.name().alias("nameAlias"),
      ]),
    q.users().fields((q) => [
      //
      q.id(),
      q.name(),
    ]),
  ])
);

console.log(JSON.stringify(query.build(), null, 2));
console.log(print(query.build()));

type Res = ResultFromOperation<typeof query>;
