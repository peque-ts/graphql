import 'cross-fetch/polyfill';
import { mergeResolvers, mergeTypeDefs } from '@graphql-tools/merge';
import { ApolloServer } from 'apollo-server-express';
import fs from 'fs';
import * as ws from 'ws';

import { Server } from 'http';
import { execute, subscribe } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { IResolvers } from '@graphql-tools/utils';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { createClient } from 'graphql-ws';
import { ApolloClient, HttpLink, InMemoryCache, split } from 'apollo-boost';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';

interface Config {
  schemaPaths: string[];
  resolvers: IResolvers[];
}

export function createGraphQLServer(config: Config): ApolloServer {
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
}

export function createGraphQLServerIntegrations(config: Config, server: Server): ApolloServer {
  const typeDefs: string[] = [];
  for (const schemaPath of config.schemaPaths) {
    const schemaFile = fs.readFileSync(schemaPath, { encoding: 'utf8' });
    typeDefs.push(schemaFile);
  }

  const mergedTypeDefs = mergeTypeDefs(typeDefs);
  const mergedResolvers = mergeResolvers(config.resolvers);
  const schema = makeExecutableSchema({ typeDefs: mergedTypeDefs, resolvers: mergedResolvers });

  const subscriptionServer = SubscriptionServer.create({ schema, execute, subscribe }, { server, path: '/graphql', });

  return new ApolloServer({
    typeDefs: mergedTypeDefs,
    resolvers: mergedResolvers,
    plugins: [{
      async serverWillStart() {
        return {
          async drainServer() {
            subscriptionServer.close();
          }
        };
      }
    }],
  });
}

export function createApolloClient(): ApolloClient<unknown> {
  const httpLink = new HttpLink({ uri: 'http://localhost:8080/graphql' });
  const subClient = createClient({ url: 'ws://localhost:8080/graphql', webSocketImpl: ws });
  const wsLink = new WebSocketLink(subClient);

  const splitLink = split(
    ({query}) => {
      const definition = getMainDefinition(query);
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    wsLink,
    httpLink
  );

  return new ApolloClient({ link: splitLink, cache: new InMemoryCache()});
}
