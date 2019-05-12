[![npm (latest)](https://img.shields.io/npm/v/@elasticlive/sdk/latest.svg)](https://www.npmjs.com/package/@elasticlive/sdk)
[![npm (next)](https://img.shields.io/npm/v/@elasticlive/sdk/next.svg)](https://www.npmjs.com/package/@elasticlive/sdk)
[![CircleCI](https://circleci.com/gh/elasticlive/web-sdk.svg?style=svg)](https://circleci.com/gh/elasticlive/web-sdk)

# elasticlive web SDK

elasticlive - WebRTC Live Streming Cloud platform

- [Website](https://elasticlive.io)

## Get SDK

### Package Manager

```bash
npm i @elasticlive/sdk
npm i webrtc-adapter      #Optional lib for legacy WebRTC API support
```

```html
<!-- Optional lib for legacy WebRTC API support -->
<script src="node_modules/webrtc-adapter/out/adapter.js"></script>

<script src="node_modules/@elasticlive/sdk/dist/ELive.min.js"></script>
```

### Static import

From [jsDelivr](https://www.jsdelivr.com)

```html
<!-- Optional lib for legacy WebRTC API support -->
<script src="https://cdn.jsdelivr.net/npm/webrtc-adapter/out/adapter.js"></script>

<!-- Latest -->
<script src="https://cdn.jsdelivr.net/npm/@elasticlive/sdk"></script>

<!-- Specific version -->
<script src="https://cdn.jsdelivr.net/npm/@elasticlive/sdk@3.0.0/dist/ELive.min.js"></script>
```

## Examples

- Simple
  - [Code](https://codesandbox.io/s/l7k87490n9)
  - [Demo](https://l7k87490n9.codesandbox.io)

## Documents

- [Guides](https://docs.elasticlive.io/)
- [API Reference](https://elasticlive.github.io/web-sdk/)

## Changelog

- [Changelog](https://github.com/elasticlive/web-sdk/blob/master/CHANGELOG.md)

## Developement

```bash
npm start

# open localhost:9099
# open localhost:9099/mock_server.html for mock broadcast server (optional)
```

If you develop with mock server, you have to set config to `config.sdk.mode="dev"`

### Production Build

```bash
npm run build
```

### Stable version tagging for production

Default npm tag is next for beta deploy. After npm deployed, you should set dist-tag to latest.

```bash
npm dist-tag add @elasticlive/sdk@xx.xx.xx latest
```

### Conturibute

Bug fixes welcome!

- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Semantic Versioning](https://semver.org)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic-release](https://semantic-release.gitbook.io/semantic-release/)
