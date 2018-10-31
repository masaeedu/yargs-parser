// :: [TypeConfigKey]
const typeConfigKeys = [
  'array',
  'narg',
  'boolean',
  'number',
  'string',
  'count',
  'config',
  'coerce'
]

// :: RawTypeConfig -> NormalizedTypeConfig
const normalizeTypeConfig = raw =>
  raw === undefined
    ? {}
    : typeof raw === 'string'
      ? { [raw]: true }
      : Array.isArray(raw)
        ? raw.map(normalizeTypeConfig).reduce((p, c) => ({ ...p, ...c }), {})
        : // Note that this encoding makes it impossible to have an option named "key" that's an array of some specified type
          raw.hasOwnProperty('key')
          ? (() => {
              const { key: k, ...v } = raw
              return { [k]: v }
            })()
          : raw

// :: RawConfig -> NormalizedConfig
const normalizeConfig = opts => {
  const { alias, default: defaults, configuration } = opts
  return typeConfigKeys.reduce(
    (p, otk) => ({ ...p, [otk]: normalizeTypeConfig(opts[otk]) }),
    { alias, default: defaults, configuration }
  )
}

module.exports = { normalizeConfig }
