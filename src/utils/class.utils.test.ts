import * as sinon from 'sinon';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { isClass } from './class.utils';

const test = suite('Class utils');

test('should recognize a class', () => {
  class FakeClass {}

  assert.ok(isClass(FakeClass));
  assert.not.ok(isClass(sinon.fake()));
});

test.run();
