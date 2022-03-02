import 'reflect-metadata';

import { gql } from 'apollo-server-express';
import express from 'express';
import { PubSub } from 'graphql-subscriptions';
import { createServer, Server } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import { Args, Mutation, PequeGraphQL, Query, Resolver, Subscription } from '../../src';
import { ResolverStorage } from '../../src/services';
import { TestApolloClient } from '../apollo/test-apollo-client.class';
import { TestApolloServer } from '../apollo/test-apollo-server.class';
import { httpTerminator, killServer } from '../http-terminator';
import { wait } from '../wait';

interface Context {
  apolloServer: TestApolloServer;
  subscriptionServer: SubscriptionServer;
  httpServer: Server;
  apolloClient: TestApolloClient;
  [key: string]: any;
}

const test = suite<Context>('Resolvers');

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
  const httpServer = createServer(app);
  httpTerminator(httpServer);

  context.apolloServer = new TestApolloServer();

  const schemaPaths = [`${__dirname}/../schema/schema_resolver_e2e.graphql`];
  const resolvers = PequeGraphQL.build(PequeGraphQL.getDeclarations().map((resolver) => new resolver()));

  context.apolloServer.create({ schemaPaths, resolvers }, { httpServer });

  await context.apolloServer.get().start();
  context.apolloServer.get().applyMiddleware({ app });

  context.httpServer = httpServer;

  await new Promise<void>((resolve) => {
    context.httpServer.listen(8080, () => {
      resolve();
    });
  });

  context.apolloClient = new TestApolloClient();
  context.apolloClient.create();
});

test.before.each((context) => {
  context.users = [
    { id: '1', name: 'Brad', surname: 'Pitt' },
    { id: '2', name: 'Leonardo', surname: 'Di Caprio' },
  ];
});

test.after(async (context) => {
  ResolverStorage.clear();
  await context.apolloClient.stop();
  await context.apolloServer.stop();
  await killServer(context.httpServer);
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

  const result = await context.apolloClient.get().query({ query });
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
  const subscription = context.apolloClient
    .get()
    .subscribe({ query: subscriptionQuery })
    .subscribe((value) => {
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
  const mutationResult = await context.apolloClient.get().mutate({
    mutation: mutationQuery,
    variables: user,
  });

  assert.equal(mutationResult.data, { createUser: context.users[context.users.length - 1] });

  await wait();
  assert.equal(subscriptionResult.data, { userCreated: context.users[context.users.length - 1] });

  subscription.unsubscribe();
});

test.run();
