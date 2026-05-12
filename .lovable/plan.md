## What went wrong

Your Netlify log shows Rollup fails here:

```
node_modules/@privy-io/react-auth/dist/esm/useSolanaRpcClient-CoFf36Ki.mjs (1:7):
"getTransactionDecoder" is not exported by "@solana/kit"
```

The same `@privy-io/react-auth@3.24.0` and `@solana/kit@6.9.0` are pinned in your `package-lock.json`, and the build **succeeds locally** with that exact lockfile. So the code is fine — the difference is that Netlify is **not installing the locked versions**.

### Why Netlify ignores the lockfile

Netlify normally runs `npm ci` (strict lockfile install) when a `package-lock.json` exists. But the moment you set `NPM_FLAGS` in `netlify.toml`, Netlify switches to plain `npm install`, which is allowed to **re-resolve transitive dependencies** to newer versions. One of `@solana/kit`'s wildcard re-exports (`export * from '@solana/transactions'`, etc.) then resolves to a version that no longer exports `getTransactionDecoder`, and Rollup blows up.

Our `netlify.toml` currently has:
```toml
NPM_FLAGS = "--legacy-peer-deps"
NPM_CONFIG_LEGACY_PEER_DEPS = "true"
```
The first line is what's forcing the unsafe install path.

## The fix

Move the legacy-peer-deps setting out of `NPM_FLAGS` and into an `.npmrc` file. That lets Netlify run `npm ci` (lockfile-strict), which is the same install path your local successful build uses.

### Step 1 — Add `.npmrc` at repo root

```
legacy-peer-deps=true
```

### Step 2 — Update `netlify.toml`

Remove the `NPM_FLAGS` line so Netlify uses `npm ci`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  CI = "false"
  NODE_VERSION = "20"
  PUPPETEER_SKIP_DOWNLOAD = "true"
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

(`NPM_CONFIG_LEGACY_PEER_DEPS` is also removed because `.npmrc` covers it and is more reliable across npm tooling.)

### Step 3 — Safety net: lock `@solana/kit` via npm overrides

Even if a future `npm install` does run, this guarantees the working version:

```json
"overrides": {
  "@solana/kit": "6.9.0"
}
```

Added to `package.json`. Then regenerate the lockfile entry once (`npm install`) and commit.

## Why this will work

- Your local build uses `npm install` against the committed lockfile and **succeeds** with `@solana/kit@6.9.0` + `@privy-io/react-auth@3.24.0`.
- After the fix, Netlify will use the same lockfile via `npm ci`, producing the same `node_modules` tree.
- The `overrides` block is a belt-and-suspenders guarantee that `@solana/kit` cannot drift to a broken version on any future install.

## After the change

1. Commit `.npmrc`, updated `netlify.toml`, updated `package.json`, and the regenerated `package-lock.json`.
2. Trigger a new Netlify deploy. The build should complete with the same `dist/` output your local build produces.

No application code changes are needed.