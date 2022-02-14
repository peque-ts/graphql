# Peque GraphQL

![coverage](https://github.com/peque-ts/graphql/raw/main/coverage-badge.svg)

Peque GraphQL is an OOP transposition for Apollo Server Resolver.

## Install

```shell
npm install @pequehq/graphql reflect-metadata
```

**Note**: tsconfig's `compilerOptions` must have both `experimentalDecorators` and `emitDecoratorMetadata` set to **true**.

## Example

```typescript
@Resolver()
class ResolverExample {
  @Query()
  user(): unknown {
    return [{ id: 1, name: 'name', surname: 'surname', location: 1 }];
  }

  @Field({ type: 'User' })
  location(@Parent() parent): unknown {
    return { id: 1, city: 'madrid', country: 'spain' };
  }

  @Field({ type: 'User' })
  family(@Parent() parent): unknown {
    return { userId: 1, father: 'father', mother: 'mother' };
  }

  @Field({ type: 'Location', name: 'properties' })
  properties(@Parent() parent): unknown {
    return [
      { locationId: 1, property: 'property 1' },
      { locationId: 1, property: 'property 2' },
    ];
  }

  @Mutation()
  insertUser(@Args() args: any): unknown {
    // no mutation op.
    return Number(args.id);
  }
}

const resolverService = new ResolverService();

const resolvers = resolverService.get(
  resolverService.getDeclarations().map((resolver) => new resolver()),
  currentResolvers,
);

// Apollo Server integration.
const schemaPaths = [
  `./schema/schema_one.graphql`,
  `./schema/schema_two.graphql`,
  `./schema/schema_three.graphql`,
];

const typeDefs: string[] = [];
for (const schemaPath of config.schemaPaths) {
  const schemaFile = fs.readFileSync(schemaPath, { encoding: 'utf8' });
  typeDefs.push(schemaFile);
}
const mergedTypeDefs = mergeTypeDefs(typeDefs);

return new ApolloServer({
  typeDefs: mergedTypeDefs,
  resolvers: mergeResolvers(config.resolvers),
});
```
