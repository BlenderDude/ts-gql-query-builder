import { GQLScalar, GQLSchema, GQLType } from "./types";

type Scalars = {
  ID: GQLScalar<"ID", string>;
  String: GQLScalar<"String", string>;
  Float: GQLScalar<"Float", number>;
  Int: GQLScalar<"Int", number>;
};

export type Post = GQLType<
  "Post",
  {
    id: { scalar: Scalars["ID"] };
    image: { scalar: Scalars["String"]; isNullable: true };
  }
>;

export type User = GQLType<
  "User",
  {
    id: { scalar: Scalars["ID"] };
    name: { scalar: Scalars["String"] };
    posts: { type: Post; isList: true };
  }
>;

export type Query = GQLType<
  "Query",
  {
    user: {
      type: User;
      args: {
        id: Scalars["ID"];
      };
    };
  }
>;

export type Schema = GQLSchema<Query, never, never>;
