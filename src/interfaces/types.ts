export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}

export type ClassDeclaration = Type;

export type IResolverFunction = (parent: unknown, args: any, ctx: any, info: unknown) => unknown;
export type IResolverParamType = 'parent' | 'args' | 'ctx' | 'info';
export type ResolverDeclaration = ClassDeclaration;
