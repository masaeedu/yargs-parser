// :: type Interpreter a = [Token] -> [(a, [Token])]
// :: NormalizedOptions -> [Token] -> Argv
const interpret = opts => tokens => {
  const OptionKey = adt({ Dotted: ["[String]"], Hyphenated: ["[Hyphenated]"] })
  const { Preface } = adt({ Preface: ["key :: OptionKey", "value :: Maybe String"] })
  // Parsers for option prefaces
  // :: Parser OptionKey

  // Parsers for value elements
  // :: Parser a -> Parser [a]
  const arrayOptionValue = v => P.sepBy(v, space)
  // :: Natural -> Parser a -> Parser [a]
  const nargOptionValue = n => sepByN(n)(space)
  // :: Parser Boolean
  const booleanOptionValue = bool
  // :: Parser Number
  const numberOptionValue = number
  // :: Parser String
  const otherOptionValue = P.regex(/.+/)

  // TODO: interpret the list of tokens into a configuration object
  // const interpretation = 
}

// Tokenizer
// :: Parser [Token]
const tokenizer = (() => {
  // :: type Hyphen = "-" | "--"
  const Token = adt({ Preface: ['hyphen :: Hyphen', 'key :: String'], Value: ['String'], Tail: ['String'] })
  const { Preface, Value, Tail } = Token

  // Option preface parser
  // One or two hyphens, followed by any non-whitespace characters
  // TODO: Allow options with numeric keys when prefixed with double hyphens (single hyphens can't be distinguished from negative numbers)
  const optionKey = P.seq(P.letter, P.alt(nonWhitespace, P.succeed(''))).tie()
  const optionPreface = seqobj({ hyphen, key: optionKey }).map(({ hyphen, key }) => Preface(hyphen)(key))

  // Value parser
  const value = P.alt(...quotedStrings, P.notFollowedBy(doubleHyphen).then(nonWhitespace)).map(Value)

  // Tail parser
  const tail = doubleHyphen.then(space).then(P.sepBy(nonWhitespace, space)).skip(P.eof).map(Tail)

  // Parser for an element of argv
  const token = P.alt(optionPreface, value, tail)
  const argv = P.sepBy(token, space)

  return argv
})()

// Detokenizer
// Laws:
// detokenize . tokenize = id
// tokenize . detokenize = id
const detokenize = xs => xs
  .map(t => t === "" || /\s/.test(t) ? `"${t}"` : t)
  .join(' ')
// TODO: Deal with the fact that naively wrapping in quotes when detokenizing is not good enough;
// some information was discarded when it was tokenized, specifically which elements were wrapped
// in quotes and what kind of quotes they were wrapped in. Since this information was thrown away,
// we will need to recover it by examining each token and seeing what kind of quotes it is safe to
// wrap the token in. This will involve consideration of the literal and escaped quotes within the
// token.


// Parsimmon utils
const seqobj = o => P.seqObj(...Object.keys(o).map(k => [k, o[k]]))
const notBeginningWith = p =>
  P.notFollowedBy(p)
    .then(P.any)
    .many()
    .tie()
const sepByN = n => sep => val => P.seq(...intersperse(sep)(replicate(n)(val)))
const optional = p => P.alt(p.map(Just), P.succeed(Nothing))
const liftN = f => xs => P.seq(...xs).map(Fn.uncurry(f))

// Parsimmon primitives
// -- Spaces and non-spaces
const space = P.string(' ')
const nonWhitespace = P.regex(/\S*/)

// -- Quoted strings
// TODO: Deal with escaped delimiters (which are valid inside the content)
const delimited = delimiter =>
  seqobj({
    open: delimiter,
    content: notBeginningWith(delimiter),
    close: delimiter
  }).map(x => x.content)
const quotedStrings = ['"', "'"].map(P.string).map(delimited)

// -- Numbers
// :: Parser Number
const natural = P.regex(/[0-9]+/).map(parseInt)
// :: Parser Number
const decimal = seqobj({
  whole: natural,
  sep: P.string('.'),
  fraction: natural
}).map(({ whole, fraction }) => parseFloat(`${whole}.${fraction}`))
// :: Parser Number -> Parser Number
const signed = n =>
  P.string('-')
    .then(n)
    .map(n => -n)
// :: Parser Number
const unsignedNumber = P.alt(natural, decimal)
// :: Parser Number
const number = P.alt(unsignedNumber, signed(unsignedNumber))

// -- Booleans
const bool = P.alt(P.string('true'), P.string('false')).map(x => x === 'true')