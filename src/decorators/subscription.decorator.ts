import { ResolverSubscriptionMetadata } from '../constants/metadata.constants';
import { ISubscriptionOptions } from '../interfaces';
import { manageResolverMetadata } from './utils/resolver-decorators.utils';

export function Subscription(options?: ISubscriptionOptions): MethodDecorator {
  return (target, propertyKey) => {
    manageResolverMetadata({ target, propertyKey, reflectionHelper: ResolverSubscriptionMetadata, options });
  };
}
