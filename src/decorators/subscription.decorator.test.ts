import 'reflect-metadata';

import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import { ResolverSubscriptionMetadata } from '../constants/metadata.constants';
import { IResolverSubscriptionMetadata, ISubscriptionFilterFunction } from '../interfaces';
import { Subscription } from './subscription.decorator';

const test = suite('@Subscription');

test('should load @Subscription metadata', async () => {
  const filterFn: ISubscriptionFilterFunction = (payload, variables) => 0;
  const metadata: IResolverSubscriptionMetadata[] = [
    { method: 'methodOne', options: undefined },
    { method: 'methodTwo', options: { name: 'location' } },
    { method: 'methodThree', options: { filter: filterFn } },
  ];

  class ResolverTest {
    @Subscription()
    methodOne(): void {
      // noop.
    }

    @Subscription({ name: 'location' })
    methodTwo(): void {
      // noop.
    }

    @Subscription({ filter: filterFn })
    methodThree(): void {
      // noop.
    }
  }

  assert.equal(ResolverSubscriptionMetadata.get(ResolverTest), metadata);
});

test.run();
