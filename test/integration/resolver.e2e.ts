import 'reflect-metadata';

import { ApolloClient } from 'apollo-boost';
import { WebSocketLink } from 'apollo-link-ws';
import { ApolloServer, gql } from 'apollo-server-express';
import express from 'express';
import { PubSub } from 'graphql-subscriptions';
import { createServer, Server } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import { Args, Mutation, PequeGraphQL, Query, Resolver, Subscription } from '../../src';
import { ResolverStorage } from '../../src/services';
import { httpTerminator, killServer } from '../http-terminator';
import { createApolloClient, createGraphQLServer, createGraphQLSubscriptionServer } from '../test.utils';
import { wait } from '../wait';

interface Context {
  apolloServer: ApolloServer;
  subscriptionServer: SubscriptionServer;
  httpServer: Server;
  apolloClient: ApolloClient<unknown>;
  wsLink: WebSocketLink;
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

  const { apolloServer, typeDefs, resolvers } = createGraphQLServer({
    schemaPaths: [`${__dirname}/../schema/schema_resolver_e2e.graphql`],
    resolvers: PequeGraphQL.build(PequeGraphQL.getDeclarations().map((resolver) => new resolver())),
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  const subscriptionServer = createGraphQLSubscriptionServer({ httpServer, typeDefs, resolvers });

  context.httpServer = httpServer;
  context.apolloServer = apolloServer;
  context.subscriptionServer = subscriptionServer;

  await new Promise<void>((resolve) => {
    context.httpServer.listen(8080, () => {
      resolve();
    });
  });

  const { apolloClient, wsLink } = createApolloClient();
  context.apolloClient = apolloClient;
  context.wsLink = wsLink;
});

test.before.each((context) => {
  context.users = [
    { id: '1', name: 'Brad', surname: 'Pitt' },
    { id: '2', name: 'Leonardo', surname: 'Di Caprio' },
  ];
});

test.after(async (context) => {
  ResolverStorage.clear();

  console.log('stopping client');
  await context.apolloClient.clearStore();
  context.apolloClient.stop();
  (context.wsLink as any).subscriptionClient.close();
  console.log('stopping client done');

  console.log('stopping subs');
  context.subscriptionServer.close();
  console.log('stopping subs done');

  console.log('stopping apollo');
  await context.apolloServer.stop();
  console.log('stopping apollo done');

  console.log('stopping http');
  await killServer(context.httpServer);
  console.log('stopping http done');
});

test('asd', () => {
  assert.ok(true);
});

/*
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
  const subscription = context.apolloClient.subscribe({ query: subscriptionQuery }).subscribe((value) => {
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

  console.log('unsubscribing');
  subscription.unsubscribe();
  console.log('unsubscribing done');
});
*/
test.run();
