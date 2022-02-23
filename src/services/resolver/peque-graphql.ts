import {
  ResolverFieldsMetadata,
  ResolverMutationsMetadata,
  ResolverParametersMetadata,
  ResolverQueriesMetadata,
} from '../../constants/metadata.constants';
import {
  ClassDeclaration,
  IFieldOptions,
  IQueryTypes,
  IResolverFunction,
  IResolverParamType,
  IResolvers,
  IResolverServiceMetadata,
  ResolverDeclaration,
} from '../../interfaces';
import { isClass } from '../../utils/class.utils';
import { ResolverStorage } from '../resolver-storage/resolver-storage.service';
import { withFilter } from 'graphql-subscriptions';

export class PequeGraphQLService {
  #calculateType(options: IFieldOptions): string {
    const type = options.type as ClassDeclaration;
    return isClass(type) ? type.name : options.type.toString();
  }

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

    const objectAssign = (key: IQueryTypes | string, property: object): void => {
      Object.assign(resolver, { [key]: { ...resolver[key], ...property } });
    };

    const calculateMethods = (type: IQueryTypes): void => {
      const metadataType = type.toLocaleLowerCase();
      if (metadata[metadataType]) {
        for (const value of metadata[metadataType]) {
          const name = value.options?.name ?? value.method;
          const objectAssignType = type === 'Field' ? this.#calculateType(value.options) : type
          let objectAssignValue;

          if (type === 'Subscription') {
            const subscriptionMethod = () => instance[value.method]();
              objectAssignValue = {
                [name]: { subscribe: value.options?.filter ? withFilter(subscriptionMethod, value.options.filter) : subscriptionMethod }
              };
          } else {
            objectAssignValue = {
              [name]: async (parent, args, ctx, info) =>
                await this.#buildMethodWithParams(instance, value.method)(parent, args, ctx, info),
            };
          }

          objectAssign(objectAssignType, objectAssignValue);
        }
      }
    }

    calculateMethods('Query');
    calculateMethods('Field');
    calculateMethods('Mutation');
    calculateMethods('Subscription');

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
