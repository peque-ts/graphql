import { mergeResolvers, mergeTypeDefs } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { IResolvers } from '@graphql-tools/utils';
import { ApolloServer } from 'apollo-server-express';
import fs from 'fs';
import { execute, subscribe } from 'graphql';
import { Server } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';

interface Config {
  schemaPaths: string[];
  resolvers: IResolvers[];
}

interface IntegrationConfig {
  httpServer: Server;
}

export class TestApolloServer {
  #server: ApolloServer;
  #subscription: SubscriptionServer;

  create(config: Config, integration?: IntegrationConfig): ApolloServer {
    const typeDefs = mergeTypeDefs(
      config.schemaPaths.map((schemaPath) => {
        return fs.readFileSync(schemaPath, { encoding: 'utf8' });
      }),
    );

    const resolvers = mergeResolvers(config.resolvers);

    if (integration) {
      const schema = makeExecutableSchema({
        typeDefs,
        resolvers,
      });

      this.#subscription = SubscriptionServer.create(
        {
          schema,
          execute,
          subscribe,
        },
        {
          server: integration.httpServer,
          path: '/graphql',
        },
      );
    }

    this.#server = new ApolloServer({ typeDefs, resolvers });
    return this.#server;
  }

  async stop() {
    if (this.#subscription) {
      this.#subscription.close();
    }
    await this.#server.stop();
  }

  get(): ApolloServer {
    return this.#server;
  }
}
