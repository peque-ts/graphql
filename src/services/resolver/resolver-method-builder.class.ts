import { withFilter } from 'graphql-subscriptions';

import {
  ResolverFieldsMetadata,
  ResolverMutationsMetadata,
  ResolverParametersMetadata,
  ResolverQueriesMetadata,
  ResolverSubscriptionMetadata,
} from '../../constants/metadata.constants';
import {
  ClassDeclaration,
  IFieldOptions,
  IResolverFunction,
  IResolverParamType,
  IResolvers,
  IResolverServiceMetadata,
  ISDLTypes,
  ResolverDeclaration,
} from '../../interfaces';
import { isClass } from '../../utils/class.utils';

export class ResolverMethodBuilder {
  readonly #instance: InstanceType<ResolverDeclaration>;
  readonly #metadata: IResolverServiceMetadata;

  #method: Record<ISDLTypes, () => unknown> = {
    Field: (): unknown => {
      const object = {};
      for (const value of this.#metadata.field ?? []) {
        const key = this.#calculateType(value.options);
        const property = value.options?.name ?? value.method;
        const propertyValue = {
          [property]: async (parent, args, ctx, info) =>
            await this.#buildMethodWithParams(value.method)(parent, args, ctx, info),
        };
        Object.assign(object, { [key]: { ...object[key], ...propertyValue } });
      }

      return object;
    },
    Query: (): unknown => {
      const object = { Query: {} };
      for (const value of this.#metadata.query) {
        const property = value.options?.name ?? value.method;
        const propertyValue = {
          [property]: async (parent, args, ctx, info) =>
            await this.#buildMethodWithParams(value.method)(parent, args, ctx, info),
        };
        Object.assign(object.Query, { ...object.Query, ...propertyValue });
      }

      return object;
    },
    Mutation: (): unknown => {
      const object = { Mutation: {} };
      for (const value of this.#metadata.mutation ?? []) {
        const property = value.options?.name ?? value.method;
        const propertyValue = {
          [property]: async (parent, args, ctx, info) =>
            await this.#buildMethodWithParams(value.method)(parent, args, ctx, info),
        };
        Object.assign(object.Mutation, { ...object.Mutation, ...propertyValue });
      }

      return object;
    },
    Subscription: (): unknown => {
      const object = { Subscription: {} };
      for (const value of this.#metadata.subscription ?? []) {
        const property = value.options?.name ?? value.method;
        const subscriptionMethod = () => this.#instance[value.method]();
        const subscribe = { subscribe: subscriptionMethod };

        if (value.options?.filter) {
          subscribe.subscribe = withFilter(subscriptionMethod, value.options.filter);
        }

        const propertyValue = { [property]: subscribe };
        Object.assign(object.Subscription, { ...object.Subscription, ...propertyValue });
      }

      return object;
    },
  };

  constructor(instance: InstanceType<ResolverDeclaration>) {
    this.#instance = instance;

    const prototype = Object.getPrototypeOf(instance).constructor;
    this.#metadata = {
      name: prototype.name,
      field: ResolverFieldsMetadata.get(prototype),
      mutation: ResolverMutationsMetadata.get(prototype),
      query: ResolverQueriesMetadata.get(prototype),
      subscription: ResolverSubscriptionMetadata.get(prototype),
    };
  }

  #calculateType(options: IFieldOptions): string {
    const type = options.type as ClassDeclaration;
    return isClass(type) ? type.name : options.type.toString();
  }

  #buildMethodWithParams(method: string): IResolverFunction {
    return (parent, args, ctx, info): unknown => {
      const params = ResolverParametersMetadata.get(Object.getPrototypeOf(this.#instance).constructor).filter(
        (param) => param.method === method,
      );
      const methodArgs: unknown[] = [];
      const apolloParams: Record<IResolverParamType, (index: number, key?: string) => void> = {
        parent: (index: number) => (methodArgs[index] = parent),
        ctx: (index: number, key?: string) => (key ? (methodArgs[index] = ctx[key]) : (methodArgs[index] = ctx)),
        args: (index: number, key?: string) => (key ? (methodArgs[index] = args[key]) : (methodArgs[index] = args)),
        info: (index: number) => (methodArgs[index] = info),
      };

      for (const param of params) {
        apolloParams[param.type](param.index, param.key);
      }

      return this.#instance[method](...methodArgs);
    };
  }

  build(): IResolvers {
    const object = {};
    const types: ISDLTypes[] = ['Query', 'Mutation', 'Field', 'Subscription'];

    for (const type of types) {
      if (!this.#metadata[type.toLocaleLowerCase()]) {
        continue;
      }

      Object.assign(object, this.#method[type]());
    }
    return object;
  }
}
