import { IResolvers, ResolverDeclaration } from '../../interfaces';
import { ResolverStorage } from '../resolver-storage/resolver-storage.service';
import { ResolverMethodBuilder } from './resolver-method-builder.class';

export class PequeGraphQLService {
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
      const methodBuilder = new ResolverMethodBuilder(resolver);
      arrResolvers.push(methodBuilder.build());
    }

    return arrResolvers;
  }
}

export const PequeGraphQL = new PequeGraphQLService();
