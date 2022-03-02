import 'reflect-metadata';

import { ApolloClient } from 'apollo-boost';
import { gql } from 'apollo-server-express';
import express from 'express';
import { PubSub } from 'graphql-subscriptions';
import { createServer } from 'http';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import { Args, Mutation, PequeGraphQL, Query, Resolver, Subscription } from '../../src';
import { ResolverStorage } from '../../src/services';
import { httpTerminator, killServer } from '../http-terminator';
import { createApolloClient, createGraphQLServerIntegrations } from '../test.utils';
import { wait } from '../wait';

const test = suite('Resolvers');

const pubSub = new PubSub();

test.before(async (context) => {
  context.users = [
    { id: '1', name: 'Brad', surname: 'Pitt' },
    { id: '2', name: 'Leonardo', surname: 'Di Caprio' },
  ];

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
      context.users.push(user);
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
  httpTerminator(context.httpServer);

  context.apolloServer = createGraphQLServerIntegrations(
    { schemaPaths: context.schemaPaths, resolvers: context.resolvers },
    context.httpServer,
  );
  await context.apolloServer.start();
  context.apolloServer.applyMiddleware({ app });
  const connectServer = new Promise<void>((resolve) => {
    context.httpServer.listen(8080, () => {
      context.apolloClient = createApolloClient();
      resolve();
    });
  });

  await connectServer;
});

test.before.each((context) => {
  context.users = [
    { id: '1', name: 'Brad', surname: 'Pitt' },
    { id: '2', name: 'Leonardo', surname: 'Di Caprio' },
  ];
});

test.after((context) => {
  ResolverStorage.clear();
  killServer(context.httpServer);
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
  assert.equal(result.data, { users: context.users });

  const subscriptionQuery = gql`
    subscription SubscriptionUser {
      userCreated {
        id
        name
        surname
      }
    }
  `;

  let subscriptionResult;
  context.apolloClient.subscribe({ query: subscriptionQuery }).subscribe((value) => {
    subscriptionResult = value;
  });

  const mutationQuery = gql`
    mutation CreateUser($createUserId: ID!, $name: String!, $surname: String!) {
      createUser(id: $createUserId, name: $name, surname: $surname) {
        id
        name
        surname
      }
    }
  `;

  const user = { createUserId: '3', name: 'Jennifer', surname: 'Aniston' };
  const mutationResult = await context.apolloClient.mutate({
    mutation: mutationQuery,
    variables: user,
  });

  assert.equal(mutationResult.data, { createUser: context.users[context.users.length - 1] });

  await wait();
  assert.equal(subscriptionResult.data, { userCreated: context.users[context.users.length - 1] });
});

test.run();
