import 'cross-fetch/polyfill';

import { mergeResolvers, mergeTypeDefs } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { IResolvers } from '@graphql-tools/utils';
import { ApolloClient, DocumentNode, HttpLink, InMemoryCache, split } from 'apollo-boost';
import { WebSocketLink } from 'apollo-link-ws';
import { ApolloServer } from 'apollo-server-express';
import { getMainDefinition } from 'apollo-utilities';
import fs from 'fs';
import { execute, subscribe } from 'graphql';
import { Server } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import ws from 'ws';

export function createGraphQLServer(config: { schemaPaths: string[]; resolvers: IResolvers[] }): {
  apolloServer: ApolloServer;
  typeDefs: DocumentNode;
  resolvers: IResolvers;
} {
  const typeDefs = mergeTypeDefs(
    config.schemaPaths.map((schemaPath) => {
      return fs.readFileSync(schemaPath, { encoding: 'utf8' });
    }),
  );

  const resolvers = mergeResolvers(config.resolvers);

  return {
    apolloServer: new ApolloServer({ typeDefs, resolvers }),
    typeDefs,
    resolvers,
  };
}

export function createGraphQLSubscriptionServer(config: {
  httpServer: Server;
  typeDefs: DocumentNode;
  resolvers: IResolvers;
}): SubscriptionServer {
  const schema = makeExecutableSchema({
    typeDefs: config.typeDefs,
    resolvers: config.resolvers,
  });

  return SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
    },
    {
      server: config.httpServer,
      path: '/graphql',
    },
  );
}
