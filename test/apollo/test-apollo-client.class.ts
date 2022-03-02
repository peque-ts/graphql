import 'cross-fetch/polyfill';

import { ApolloClient, HttpLink, InMemoryCache, split } from 'apollo-boost';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
import ws from 'ws';

export class TestApolloClient {
  #client: ApolloClient<any>;
  #wsLink: WebSocketLink;

  create(): ApolloClient<any> {
    const httpLink = new HttpLink({ uri: 'http://localhost:8080/graphql' });
    this.#wsLink = new WebSocketLink({
      uri: 'ws://localhost:8080/graphql',
      options: { reconnect: true },
      webSocketImpl: ws,
    });

    const splitLink = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
      },
      this.#wsLink,
      httpLink,
    );

    this.#client = new ApolloClient({
      link: splitLink,
      cache: new InMemoryCache({
        addTypename: false,
      }),
    });

    return this.#client;
  }

  async stop(): Promise<void> {
    await this.#client.clearStore();
    this.#client.stop();
    (this.#wsLink as any).subscriptionClient.close();
  }

  get(): ApolloClient<unknown> {
    return this.#client;
  }
}
