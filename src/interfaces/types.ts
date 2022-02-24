interface Type<T = any> extends Function {
  new (...args: any[]): T;
}

type ClassDeclaration = Type;

type IResolvers = Record<string, any>;

type IQueryTypes = 'Query' | 'Mutation' | 'Subscription' | 'Field';
type IResolverFunction = (parent: unknown, args: any, ctx: any, info: unknown) => unknown;
type IResolverParamType = 'parent' | 'args' | 'ctx' | 'info';
type ResolverDeclaration = ClassDeclaration;
type ISubscriptionFilterFunction = (payload: any, variables: any) => void;

export type {
  ClassDeclaration,
  IResolverFunction,
  IResolverParamType,
  ResolverDeclaration,
  IResolvers,
  IQueryTypes,
  ISubscriptionFilterFunction,
};
