import {
  ResolverFieldsMetadata,
  ResolverMutationsMetadata,
  ResolverParametersMetadata,
  ResolverQueriesMetadata,
} from '../../constants/metadata.constants';
import {
  IResolverFunction,
  IResolverParamType,
  IResolvers,
  IResolverServiceMetadata,
  ResolverDeclaration,
} from '../../interfaces';
import { ResolverStorage } from '../resolver-storage/resolver-storage.service';

class PequeGraphQLService {
  #buildMetadata(resolver: ResolverDeclaration): IResolverServiceMetadata {
    const prototype = Object.getPrototypeOf(resolver).constructor;
    return {
      name: prototype.name,
      field: ResolverFieldsMetadata.get(prototype),
      mutation: ResolverMutationsMetadata.get(prototype),
      query: ResolverQueriesMetadata.get(prototype),
    };
  }

  #buildMethodWithParams(instance: InstanceType<ResolverDeclaration>, method: string): IResolverFunction {
    return (parent, args, ctx, info): unknown => {
      const params = ResolverParametersMetadata.get(Object.getPrototypeOf(instance).constructor).filter(
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

      return instance[method](...methodArgs);
    };
  }

  #buildInterface(instance: InstanceType<ResolverDeclaration>, metadata: IResolverServiceMetadata): IResolvers {
    const resolver: IResolvers = {};

    const objectAssign = (key: string, property: object): void => {
      Object.assign(resolver, { [key]: { ...resolver[key], ...property } });
    };

    if (metadata.query) {
      for (const query of metadata.query) {
        const name = query.options?.name ?? query.method;
        objectAssign('Query', {
          [name]: async (parent, args, ctx, info) =>
            await this.#buildMethodWithParams(instance, query.method)(parent, args, ctx, info),
        });
      }
    }

    if (metadata.field) {
      for (const field of metadata.field) {
        const name = field.options?.name ?? field.method;
        objectAssign(field.options.type, {
          [name]: async (parent, args, ctx, info) =>
            await this.#buildMethodWithParams(instance, field.method)(parent, args, ctx, info),
        });
      }
    }

    if (metadata.mutation) {
      for (const mutation of metadata.mutation) {
        const name = mutation.options?.name ?? mutation.method;
        objectAssign('Mutation', {
          [name]: async (parent, args, ctx, info) =>
            await this.#buildMethodWithParams(instance, mutation.method)(parent, args, ctx, info),
        });
      }
    }

    return resolver;
  }

  getDeclarations(): ResolverDeclaration[] {
    return ResolverStorage.getAll();
  }

  build(resolvers: InstanceType<ResolverDeclaration>[], currentResolvers?: IResolvers | IResolvers[]): IResolvers[] {
    const arrResolvers: IResolvers[] = [];

    if (currentResolvers) {
      arrResolvers.push(
        ...new Set<IResolvers>(Array.isArray(currentResolvers) ? currentResolvers : [currentResolvers]),
      );
    }

    for (const resolver of resolvers) {
      const metadata = this.#buildMetadata(resolver);
      arrResolvers.push(this.#buildInterface(resolver, metadata));
    }

    return arrResolvers;
  }
}

export const PequeGraphQL = new PequeGraphQLService();
