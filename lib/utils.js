const util = require('util')
const { match: natch, otherwise } = require('natch')

// Misc utils
const replicate = n => x => Array(n).fill(x)
const intersperse = i => {
  const rec = natch(
    xs => xs.length,

    [0, _ => []],
    [otherwise, ([x, ...xs]) => [x, i, ...rec(xs)]]
  )
  return rec
}
const splitWhen = f => xs => {
  const i = xs.findIndex(f)
  return i === -1 ? [xs, []] : [xs.slice(0, i), xs.slice(i)]
}
const log = x => {
  console.log(util.inspect(x, { depth: null }))
  return x
}
// const log = x => x
const copy = x =>
  typeof x === 'string' ? x : Array.isArray(x) ? [...x] : { ...x }

module.exports = { replicate, intersperse, splitWhen, log, copy }
