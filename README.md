# Peque GraphQL

[![CI](https://github.com/pequehq/graphql/actions/workflows/ci.yml/badge.svg)](https://github.com/pequehq/graphql/actions/workflows/ci.yml)
![coverage](https://github.com/peque-ts/graphql/raw/main/coverage-badge.svg)

Peque GraphQL allows you to code your [Apollo](https://www.apollographql.com/docs/apollo-server/) resolvers following an
[OOP](https://en.wikipedia.org/wiki/Object-oriented_programming)/[AOP](https://en.wikipedia.org/wiki/Aspect-oriented_programming)
flavor to better fit enterprise-level paradigms and patterns.

## Install

```shell
npm install @pequehq/graphql reflect-metadata
```

**Note**: tsconfig's `compilerOptions` must have both `experimentalDecorators` and `emitDecoratorMetadata` set to **true**.

## Usage example

```typescript
import { mergeResolvers } from '@graphql-tools/merge';
import { PequeGraphQL, Args, Query, Resolver } from '@pequehq/graphql';

@Resolver()
class ResolverExample {
  @Query()
  countries(@Args('continent') continent: string) {
    return [
      { name: 'italy', continent: 'europe' },
      { name: 'spain', continent: 'europe' },
      { name: 'china', continent: 'asia' },
    ].filter((country) => country.continent === continent);
  }
}

const resolvers = PequeGraphQL.build([new ResolverExample()]);

// Add resolvers to your Apollo Server config.
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers: mergeResolvers(resolvers),
});
```

## Documentation

Please check out the [documentation website](https://peque.dev/docs/graphql).
