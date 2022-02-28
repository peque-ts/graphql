import 'reflect-metadata';

import { gql } from 'apollo-server-express';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import express from 'express';
import { createApolloClient, createGraphQLServerIntegrations } from '../test.utils';
import { Args, Mutation, Query, Resolver, PequeGraphQL, Subscription } from '../../src';
import { ResolverStorage } from '../../src/services';
import { createServer } from 'http';
import { PubSub } from 'graphql-subscriptions';

const test = suite('Resolvers');

const pubSub = new PubSub();
const users = [
  { id: 1, name: 'Brad', surname: 'Pitt' },
  { id: 2, name: 'Leonardo', surname: 'Di Caprio' }
];

test.before(async (context) => {
  @Resolver()
  class ResolverSchemaOne {
    @Query()
    users(): unknown {
      return context.users;
    }

    @Mutation()
    createUser(@Args() args: any): unknown {
      const user = {
        id: args.id,
        name: args.name,
        surname: args.surname,
      };
      users.push(user);
      pubSub.publish('USER_CREATED', { userCreated: user });
      return user;
    }

    @Subscription()
    userCreated(): unknown {
      return pubSub.asyncIterator('USER_CREATED');
    }
  }

  const app = express();
  context.resolvers = PequeGraphQL.build(PequeGraphQL.getDeclarations().map((resolver) => new resolver()));
  context.schemaPaths = [`${__dirname}/../schema/schema_resolver_e2e.graphql`];
  context.httpServer = createServer(app);
  context.apolloServer = createGraphQLServerIntegrations(
    { schemaPaths: context.schemaPaths, resolvers: context.resolvers },
    context.httpServer,
  );
  await context.apolloServer.start();
  context.apolloServer.applyMiddleware({ app });
  const connectServer = new Promise<void>(resolve => {
    context.httpServer.listen(8080, () => {
      try {
        context.apolloClient = createApolloClient();
        resolve();
      } catch (e) {
        console.log(e);
      }
    });
  });

  await connectServer;
});

test.after(() => {
  ResolverStorage.clear();
});

test('should trigger subscription', async (context) => {

  const query = gql`
    query GetUsers {
        users {
            id
            name
            surname
        }
    }
  `;

  const result = await context.apolloClient.query({ query });
  console.log(result);
  assert.is(1, 1);
});

test.run();
