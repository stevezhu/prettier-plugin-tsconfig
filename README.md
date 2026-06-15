# prettier-plugin-tsconfig

Prettier plugin to sort tsconfig.json files.

It hooks into Prettier's JSON formatting and reorders the keys in `tsconfig.json` and `jsconfig.json` files to follow the order used by the official [TSConfig Reference](https://www.typescriptlang.org/tsconfig). Keys that aren't in the reference are kept and sorted alphabetically at the end.

## Installation

```sh
pnpm add -D @stzhu/prettier-plugin-tsconfig
```

```sh
npm install -D @stzhu/prettier-plugin-tsconfig
```

```sh
yarn add -D @stzhu/prettier-plugin-tsconfig
```

Prettier `3.x` is required (it's a peer dependency).

## Usage

Add the plugin to your [Prettier configuration](https://prettier.io/docs/configuration).

`.prettierrc.json`:

```json
{
  "plugins": ["@stzhu/prettier-plugin-tsconfig"]
}
```

`prettier.config.js`:

```js
export default {
  plugins: ['@stzhu/prettier-plugin-tsconfig'],
};
```

Then run Prettier as usual:

```sh
prettier --write tsconfig.json
```

The plugin automatically applies to any file matching `tsconfig.json`,
`jsconfig.json`, or a variant such as `tsconfig.build.json` /
`jsconfig.base.json`. No other JSON files are affected.

To format every config file in your project, use a glob:

```sh
prettier -w '**/{ts,js}config{,.?*}.json'
```

## Generating sort order map

```
pnpm run generate
```

This updates the generate sort order map json with the latest values scraped from the tsconfig reference website: https://www.typescriptlang.org/tsconfig.
