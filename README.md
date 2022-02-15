# Peque GraphQL

[![CI](https://github.com/pequehq/graphql/actions/workflows/ci.yml/badge.svg)](https://github.com/pequehq/graphql/actions/workflows/ci.yml)
![coverage](https://github.com/peque-ts/graphql/raw/main/coverage-badge.svg)

Peque GraphQL is an OOP transposition for Apollo Server Resolver.

## Install

```shell
npm install @pequehq/graphql reflect-metadata
```

**Note**: tsconfig's `compilerOptions` must have both `experimentalDecorators` and `emitDecoratorMetadata` set to **true**.

## Example

```typescript
import { Resolver, ResolverService } from '@pequehq/graphql';

@Resolver()
class ResolverExample {
  @Query()
  countries(@Args('continent') continent: string): unknown {
    return [
      { id: 1, name: 'italy', continent: 'europe' },
      { id: 2, name: 'spain', continent: 'europe' },
      { id: 3, name: 'china', continent: 'asia' },
    ].filter((country) => country.continent === continent);
  }
}

const resolverService = new ResolverService();

const resolvers = resolverService.get([new ResolverExample()]);

// Add resolvers to your Apollo Server integration.
```
