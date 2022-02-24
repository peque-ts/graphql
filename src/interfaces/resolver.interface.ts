import { ISubscriptionFilterFunction } from '../decorators/subscription.decorator.types';
import { ClassDeclaration, IResolverParamType } from './types';

export interface IResolverParameterMetadata {
  method: string;
  type: IResolverParamType;
  index: number;
  key?: string;
}

export interface IResolverMetadata<TOptions> {
  method: string;
  options?: TOptions;
}

export interface IQueryOptions {
  name: string;
}

export interface IMutationOptions {
  name: string;
}

export interface ISubscriptionOptions {
  name?: string;
  filter?: ISubscriptionFilterFunction;
}

export interface IFieldOptions {
  name?: string;
  type: string | ClassDeclaration;
}

export type IResolverQueryMetadata = IResolverMetadata<IQueryOptions>;
export type IResolverMutationMetadata = IResolverMetadata<IMutationOptions>;
export type IResolverSubscriptionMetadata = IResolverMetadata<ISubscriptionOptions>;
export type IResolverFieldMetadata = Required<IResolverMetadata<IFieldOptions>>;

export interface IResolverServiceMetadata {
  name: string;
  query: IResolverQueryMetadata[];
  field?: IResolverFieldMetadata[];
  mutation?: IResolverMutationMetadata[];
  subscription?: IResolverSubscriptionMetadata[];
}
