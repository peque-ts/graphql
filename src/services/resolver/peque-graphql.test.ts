import 'reflect-metadata';

import { gql } from 'apollo-server-express';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import { createGraphQLServer } from '../../../test/test.utils';
import { Args, Field, Mutation, Parent, Query, Resolver } from '../../decorators';
import { ResolverStorage } from '../resolver-storage/resolver-storage.service';
import { PequeGraphQL } from './peque-graphql';

const test = suite('ResolverService');

test.before(async (context) => {
  @Resolver()
  class ResolverSchemaOne {
    @Query()
    user(): Promise<unknown> {
      return new Promise((resolve) => {
        setTimeout(() => resolve([{ id: 1, name: 'name', surname: 'surname', location: 1 }]), 1000);
      });
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
      const user = {
        id: 1,
        name: 'name',
        surname: 'surname',
        location: {
          id: 1,
          city: 'madrid',
          country: 'spain',
          properties: [
            { locationId: 1, property: 'property 1' },
            { locationId: 1, property: 'property 2' },
          ],
        },
        family: { userId: 1, father: 'father', mother: 'mother' },
      };
      return Number(args.id);
    }
  }

  @Resolver()
  class ResolverSchemaTwo {
    @Query()
    countries(@Args('continent') continent: string): unknown {
      return [
        { id: 1, name: 'italy', continent: 'europe' },
        { id: 2, name: 'spain', continent: 'europe' },
        { id: 3, name: 'china', continent: 'asia' },
      ].filter((country) => country.continent === continent);
    }
  }

  const currentResolvers = [
    { Query: { testOne: (): string => 'testOne' } },
    { Query: { testTwo: (): string => 'testTwo' } },
  ];

  context.currentResolvers = currentResolvers;
  context.resolvers = PequeGraphQL.build(
    PequeGraphQL.getDeclarations().map((resolver) => new resolver()),
    currentResolvers,
  );
  context.schemaPaths = [
    `${__dirname}/../../../test/schema/schema_one.graphql`,
    `${__dirname}/../../../test/schema/schema_two.graphql`,
    `${__dirname}/../../../test/schema/schema_three.graphql`,
  ];
  context.apolloServer = createGraphQLServer({ schemaPaths: context.schemaPaths, resolvers: context.resolvers });
});

test.after(() => {
  ResolverStorage.clear();
});

test('should load the resolvers', (context) => {
  assert.is(context.resolvers.length, 4);
});

test('should run lib resolvers correctly', async (context) => {
  const queryOne = gql`
    query Query {
      user {
        id
        name
        surname
        location {
          id
          city
          country
          properties {
            locationId
            property
          }
        }
        family {
          father
          mother
          userId
        }
      }
    }
  `;

  const resultMatchOne = {
    user: [
      {
        id: '1',
        name: 'name',
        surname: 'surname',
        location: {
          id: '1',
          city: 'madrid',
          country: 'spain',
          properties: [
            {
              locationId: '1',
              property: 'property 1',
            },
            {
              locationId: '1',
              property: 'property 2',
            },
          ],
        },
        family: {
          father: 'father',
          mother: 'mother',
          userId: '1',
        },
      },
    ],
  };

  const resultOne = await context.apolloServer.executeOperation({ query: queryOne });

  assert.equal(JSON.stringify(resultOne.data), JSON.stringify(resultMatchOne));

  const queryTwo = gql`
    query Countries($continent: String) {
      countries(continent: $continent) {
        name
        continent
        id
      }
    }
  `;

  const resultMatchTwo = {
    countries: [
      { name: 'italy', continent: 'europe', id: '1' },
      { name: 'spain', continent: 'europe', id: '2' },
    ],
  };

  const resultTwo = await context.apolloServer.executeOperation({
    query: queryTwo,
    variables: { continent: 'europe' },
  });

  assert.equal(JSON.stringify(resultTwo.data), JSON.stringify(resultMatchTwo));
});

test('should run pre-existent resolvers correctly', async (context) => {
  const queryOne = gql`
    query Query {
      testOne
    }
  `;

  const resultMatchOne = { testOne: 'testOne' };

  const resultOne = await context.apolloServer.executeOperation({ query: queryOne });

  assert.equal(JSON.stringify(resultOne.data), JSON.stringify(resultMatchOne));

  const queryTwo = gql`
    query Query {
      testTwo
    }
  `;

  const resultMatchTwo = { testTwo: 'testTwo' };

  const resultTwo = await context.apolloServer.executeOperation({ query: queryTwo });

  assert.equal(JSON.stringify(resultTwo.data), JSON.stringify(resultMatchTwo));
});

test.run();
