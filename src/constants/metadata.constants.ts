import { ReflectionHelper } from '../helpers';
import {
  IResolverFieldMetadata,
  IResolverMutationMetadata,
  IResolverParameterMetadata,
  IResolverQueryMetadata,
  IResolverSubscriptionMetadata,
} from '../interfaces';

export const ResolverFieldsMetadata = new ReflectionHelper<IResolverFieldMetadata[]>('resolver:fields');
export const ResolverQueriesMetadata = new ReflectionHelper<IResolverQueryMetadata[]>('resolver:queries');
export const ResolverMutationsMetadata = new ReflectionHelper<IResolverMutationMetadata[]>('resolver:mutations');
export const ResolverSubscriptionMetadata = new ReflectionHelper<IResolverSubscriptionMetadata[]>('resolver:subscriptions');
export const ResolverParametersMetadata = new ReflectionHelper<IResolverParameterMetadata[]>('resolver:parameters');
