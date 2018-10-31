const { adt, match } = require('@masaeedu/adt')
const { Fn, Arr } = require('@masaeedu/fp')
const P = require('parsimmon')

// -- Hyphens
const doubleHyphen = P.string('--')
const singleHyphen = P.string('-')

// ADTs
// :: type Hyphen = "-" | "--"
// const OptionKey = adt({ Plain: ["String"], Hyphenated: ["[String]"], Dotted: ["[String]"] })
const Token = adt({
  ShortFlag: ['key :: String'],
  ShortFlagWithValue: ['key :: String', 'value :: String'],
  LongFlag: ['key :: String'],
  LongFlagWithValue: ['key :: String', 'value :: String'],
  Positional: ['String']
})
const {
  ShortFlag,
  ShortFlagWithValue,
  LongFlag,
  LongFlagWithValue,
  Positional
} = Token

// Parse each token in argv into a structured representation
const parseToken = (() => {
  const nonSeparator = P.regex(/[^=\s]+/)

  const equalsValue = P.string('=').then(nonSeparator)

  const shortFlag = singleHyphen.then(P.lookahead(P.letter)).then(nonSeparator)

  const shortFlagWithValue = P.seq(shortFlag, equalsValue)

  const longFlag = doubleHyphen.then(nonSeparator)

  const longFlagWithValue = P.seq(longFlag, equalsValue)

  const positional = P.regex(/[\s\S]*/)

  const token = P.alt(
    longFlagWithValue.map(Fn.uncurry(LongFlagWithValue)).skip(P.eof),
    longFlag.map(LongFlag).skip(P.eof),
    shortFlagWithValue.map(Fn.uncurry(ShortFlagWithValue)).skip(P.eof),
    shortFlag.map(ShortFlag).skip(P.eof),
    positional.map(Positional).skip(P.eof)
  )

  return x => token.tryParse(x)
})()

// Split elements of the token stream where a key and value are mashed together
const splitTokens = Arr.chain(
  match({
    Positional: x => [Positional(x)],
    LongFlag: x => [LongFlag(x)],
    ShortFlag: x => x.split('').map(ShortFlag),
    LongFlagWithValue: k => v => [LongFlag(k), Positional(v)],
    ShortFlagWithValue: k => v => [ShortFlag(k), Positional(v)]
  })
)

const foldr = f => z => xs => xs.reduceRight((p, c) => f(c)(p), z)

// Interpret the token stream into a final argv
const interpretTokens = opts =>
  foldr(
    match({
      // When positional arguments are encountered, put them into the _ array
      Positional: x => ({ _, ...o }) => ({
        _: [!Number.isNaN(parseFloat(x)) ? parseFloat(x) : x, ..._],
        ...o
      }),

      // When short flags are encountered, slurp up an appropriate number of the
      // positional arguments and use them to enrich the information associated
      // with a particular key
      ShortFlag: k => ({ _, [k]: v = undefined, ...o }) => {
        if (_.length === 0) return { _, [k]: true, ...o }

        const [x, ...xs] = _
        return { _: xs, [k]: x, ...o }
      },

      // When long flags are encountered, slurp up an appropriate number of the
      // positional arguments and use them to enrich the information associated
      // with a particular key
      LongFlag: k => ({ _, [k]: v = undefined, ...o }) => {
        if (_.length === 0) return { _, [k]: true, ...o }

        const [x, ...xs] = _
        return { _: xs, [k]: x, ...o }
      }
    })
  )({ ...opts.defaults, _: [] })

module.exports = { parseToken, splitTokens, interpretTokens }
