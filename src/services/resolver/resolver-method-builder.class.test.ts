import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Field, Mutation, Query, Resolver, Subscription } from '../../decorators';
import { ResolverMethodBuilder } from './resolver-method-builder.class';

const test = suite('ResolverMethodBuilder');

test('should build resolver methods', () => {
  @Resolver()
  class ResolverSchemaOne {
    @Query()
    query(): void {
      // noop
    }

    @Field({ type: 'User' })
    location(): void {
      // noop
    }

    @Field({ type: 'User' })
    family(): void {
      // noop
    }

    @Field({ type: 'Location', name: 'properties' })
    locationProperties(): void {
      // noop
    }

    @Mutation()
    mutation(): void {
      // noop.
    }

    @Subscription()
    subscription(): void {
      // noop.
    }
  }

  const resolverMethodBuilder = new ResolverMethodBuilder(new ResolverSchemaOne());
  const methods = resolverMethodBuilder.build();

  assert.ok(methods.Query.query);
  assert.ok(methods.Mutation.mutation);
  assert.ok(methods.Subscription.subscription);
  assert.ok(methods.User.location);
  assert.ok(methods.User.family);
  assert.ok(methods.Location.properties);
});

test.run();
