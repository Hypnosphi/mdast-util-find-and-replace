'use strict'

var test = require('tape')
var u = require('unist-builder')
var findAndReplace = require('.')

test('findAndReplace', function (t) {
  t.throws(
    function () {
      findAndReplace(create(), true)
    },
    /^Error: Expected array or object as schema$/,
    'should throw on invalid search and replaces'
  )

  t.deepEqual(
    findAndReplace(create(), 'emphasis'),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', []),
      u('text', ', '),
      u('strong', [u('text', 'importance')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should remove without `replace`'
  )

  t.deepEqual(
    findAndReplace(create(), 'emphasis', '!!!'),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('text', '!!!')]),
      u('text', ', '),
      u('strong', [u('text', 'importance')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should work when given `find` and `replace`'
  )

  t.deepEqual(
    findAndReplace(create(), /em(\w+)is/, function ($0, $1) {
      return '[' + $1 + ']'
    }),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('text', '[phas]')]),
      u('text', ', '),
      u('strong', [u('text', 'importance')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should work when given `find` as a `RegExp` and `replace` as a `Function`'
  )

  t.deepEqual(
    findAndReplace(create(), 'emphasis', function () {
      return u('delete', [u('break')])
    }),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('delete', [u('break')])]),
      u('text', ', '),
      u('strong', [u('text', 'importance')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should work when given `replace` returns a node'
  )

  t.deepEqual(
    findAndReplace(create(), [
      ['emphasis', '!!!'],
      ['importance', '???']
    ]),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('text', '!!!')]),
      u('text', ', '),
      u('strong', [u('text', '???')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should work when given `search` as an matrix of strings'
  )

  t.deepEqual(
    findAndReplace(create(), {emp: 'hacks', ',': '!'}),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('text', 'hacks'), u('text', 'hasis')]),
      u('text', '!'),
      u('text', ' '),
      u('strong', [u('text', 'importance')]),
      u('text', '!'),
      u('text', ' and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should work when given `search` as an object of strings'
  )

  t.deepEqual(
    findAndReplace(create(), /\Bmp\B/, '[MP]'),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('text', 'e'), u('text', '[MP]'), u('text', 'hasis')]),
      u('text', ', '),
      u('strong', [u('text', 'i'), u('text', '[MP]'), u('text', 'ortance')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should work on partial matches'
  )

  t.deepEqual(
    findAndReplace(create(), {
      emphasis: function () {
        return u('link', [u('text', 'importance')])
      },
      importance: 'something else'
    }),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('link', [u('text', 'something else')])]),
      u('text', ', '),
      u('strong', [u('text', 'something else')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should find-and-replace recursively'
  )

  t.deepEqual(
    findAndReplace(
      u('paragraph', [
        u('text', 'Some '),
        u('emphasis', [u('text', 'importance')]),
        u('text', ' and '),
        u('strong', [u('text', 'importance')]),
        u('text', '.')
      ]),
      'importance',
      '!!!',
      {ignore: 'strong'}
    ),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('text', '!!!')]),
      u('text', ' and '),
      u('strong', [u('text', 'importance')]),
      u('text', '.')
    ]),
    'should ignore from options'
  )

  t.deepEqual(
    findAndReplace(
      u('paragraph', [u('text', 'Some emphasis, importance, and code.')]),
      {
        importance: function (value) {
          return u('strong', [u('text', value)])
        },
        code: function (value) {
          return u('inlineCode', value)
        },
        emphasis: function (value) {
          return u('emphasis', [u('text', value)])
        }
      }
    ),
    create(),
    'should not be order-sensitive with strings'
  )

  t.deepEqual(
    findAndReplace(
      u('paragraph', [u('text', 'Some emphasis, importance, and code.')]),
      [
        [
          /importance/g,
          function (value) {
            return u('strong', [u('text', value)])
          }
        ],
        [
          /code/g,
          function (value) {
            return u('inlineCode', value)
          }
        ],
        [
          /emphasis/g,
          function (value) {
            return u('emphasis', [u('text', value)])
          }
        ]
      ]
    ),
    create(),
    'should not be order-sensitive with regexes'
  )

  t.deepEqual(
    findAndReplace(create(), 'emphasis', () => false),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('text', 'emphasis')]),
      u('text', ', '),
      u('strong', [u('text', 'importance')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should not replace when returning false'
  )

  t.deepEqual(
    findAndReplace(u('paragraph', [u('text', 'asd.')]), 'asd', (d) => d),
    u('paragraph', [u('text', 'asd'), u('text', '.')]),
    'should not recurse into a replaced value'
  )

  t.deepEqual(
    findAndReplace(u('paragraph', [u('text', 'asd.')]), 'asd', (d) =>
      u('emphasis', [u('text', d)])
    ),
    u('paragraph', [u('emphasis', [u('text', 'asd')]), u('text', '.')]),
    'should not recurse into a replaced node (head)'
  )

  t.deepEqual(
    findAndReplace(u('paragraph', [u('text', '.asd')]), 'asd', (d) =>
      u('emphasis', [u('text', d)])
    ),
    u('paragraph', [u('text', '.'), u('emphasis', [u('text', 'asd')])]),
    'should not recurse into a replaced node (tail)'
  )

  t.deepEqual(
    findAndReplace(u('paragraph', [u('text', 'asd')]), 'asd', (d) =>
      u('emphasis', [u('text', d)])
    ),
    u('paragraph', [u('emphasis', [u('text', 'asd')])]),
    'should not recurse into a replaced node (head and tail)'
  )

  t.deepEqual(
    findAndReplace(create(), 'and', 'alert(1)'),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('text', 'emphasis')]),
      u('text', ', '),
      u('strong', [u('text', 'importance')]),
      u('text', ', '),
      u('text', 'alert(1)'),
      u('text', ' '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'security: replacer as string (safe)'
  )

  t.end()
})

function create() {
  return u('paragraph', [
    u('text', 'Some '),
    u('emphasis', [u('text', 'emphasis')]),
    u('text', ', '),
    u('strong', [u('text', 'importance')]),
    u('text', ', and '),
    u('inlineCode', 'code'),
    u('text', '.')
  ])
}
