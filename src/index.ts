import { Schema } from "./schema";
import { makeTSGQL, ResultFromOperation } from "./types";

const tsgql = makeTSGQL<Schema>();

const query = tsgql("Test", "Query", (q) => [
  q.user({}, (q) => [
    //
    q.id(),
    q.name(),
    q.posts({}, (q) => [
      //
      q.id({ alias: "test" }),
    ]),
  ]),
]);

type Result = ResultFromOperation<typeof query>;
