interface Type<T = any> extends Function {
  new (...args: any[]): T;
}

type ClassDeclaration = Type;

type IResolvers = Record<string, any>;

type IResolverFunction = (parent: unknown, args: any, ctx: any, info: unknown) => unknown;
type IResolverParamType = 'parent' | 'args' | 'ctx' | 'info';
type ResolverDeclaration = ClassDeclaration;

export type { IResolverFunction, IResolverParamType, ResolverDeclaration, IResolvers };
