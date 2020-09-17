// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { ESLintUtils } from '@typescript-eslint/experimental-utils';
import { typedefVar } from './typedef-var';

const { RuleTester } = ESLintUtils;
const ruleTester = new RuleTester({
  parser: '@typescript-eslint/parser'
});

ruleTester.run('typedef-var', typedefVar, {
  invalid: [
    {
      code: 'const x = 123;',
      errors: [{ messageId: 'expected-typedef-named' }]
    },
    {
      code: 'let x = 123;',
      errors: [{ messageId: 'expected-typedef-named' }]
    },
    {
      code: 'var x = 123;',
      errors: [{ messageId: 'expected-typedef-named' }]
    },
    {
      code: '{ const x = 123; }',
      errors: [{ messageId: 'expected-typedef-named' }]
    }
  ],
  valid: [
    {
      code: 'function f() { const x = 123; }'
    },
    {
      code: 'const f = () => { const x = 123; };'
    },
    {
      code: 'const f = function() { const x = 123; }'
    },
    {
      code: 'for (const x of []) { }'
    },
    {
      // prettier-ignore
      code: [
        'let { a , b } = {',
        '  a: 123,',
        '  b: 234',
        '}',
      ].join('\n')
    },
    {
      // prettier-ignore
      code: [
        'class C {',
        '  public m(): void {',
        '    const x = 123;',
        '  }',
        '}',
      ].join('\n')
    },
    {
      // prettier-ignore
      code: [
        'class C {',
        '  public m = (): void => {',
        '    const x = 123;',
        '  }',
        '}',
      ].join('\n')
    }
  ]
});
