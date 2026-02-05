# Publishing Guide

## Prerequisites
- Node.js 18+
- VSCE (`npm install -g vsce`)
- NPM Account (logged in via `npm login`)
- VS Code Marketplace Publisher Token

## 1. Publish CLI to NPM

```bash
cd packages/cli
npm version patch
npm publish --access public
```

## 2. Publish VS Code Extension

```bash
cd packages/extension
npm install
npm run package # Bundles the extension
vsce package    # Generates .vsix file
vsce publish    # Publishes to Marketplace
```

## 3. Publish Desktop UI (Electron)

```bash
cd packages/desktop-ui
npm install
npm run build
npm run dist    # Generates .dmg, .exe, .AppImage
```

## 4. Open VSX (Alternative Registry)

```bash
ovsx publish
```

## 5. Post-Publish Verification

After publishing, verify "Realtime Visibility":
1. Open the Desktop UI.
2. Ensure `~/.ai-doc/registry.json` is being updated by the VS Code Extension.
3. Check that the "Watched Projects" list in the UI reflects all open VS Code windows.
