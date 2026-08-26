// Smoke test: this app still exports a CyApp the host can load.
//
// It reaches the config through src/index.ts — the exact module the host loads
// as `./AppConfig` — so a broken re-export fails here rather than in a browser.
//
// Note what it does NOT do: import a component. Anything that calls a cyweb/*
// API cannot be imported outside a running host yet.

import { describe, expect, it } from 'vitest'

import { buildInstallManifest, readAppMeta } from '@cytoscape-web/app-runtime/vite'

const root = new URL('..', import.meta.url).pathname

describe('app config', () => {
  it('matches the identity declared in package.json', async () => {
    const meta = readAppMeta(root)
    const { default: app } = await import('../src/index')

    expect(app.id).toBe(meta.id)
    expect(app.name).toBe(meta.displayName)
    expect(app.version).toBe(meta.version)
  })

  it('declares 1 resource(s) the host can render', async () => {
    const { default: app } = await import('../src/index')
    const slots = (app.resources ?? []).map((r) => r.slot)

    expect(slots).toHaveLength(1)
    // Any other slot is dropped with an "Unsupported slot" log line.
    for (const slot of slots) {
      expect(['right-panel', 'apps-menu']).toContain(slot)
    }
  })

  it('has a mount hook, because its context menus register there', async () => {
    // The three subpathway items are the app. If mount() ever goes away they
    // go with it, silently — the host just never calls anything.
    const { default: app } = await import('../src/index')
    expect(typeof app.mount).toBe('function')
  })

  it('gives the same identity to the dev install manifest', async () => {
    // The manifest the dev server serves at /cyweb-app.json is what the host
    // reads when you open the printed install link.
    const meta = readAppMeta(root)
    const { default: app } = await import('../src/index')
    const entry = buildInstallManifest(meta, `http://localhost:${meta.port}`)[0]

    expect(entry.id).toBe(app.id)
    expect(entry.url).toBe(`http://localhost:${meta.port}/remoteEntry.js`)
  })
})
