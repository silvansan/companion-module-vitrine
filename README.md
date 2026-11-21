# companion-module-vitrine

A [Bitfocus Companion](https://bitfocus.io/companion) module for [Vitrine](https://github.com/silvansan/Vitrine): put guest photos, videos and audio on vMix from a Stream Deck, and use what is live to drive lights and mics.

- Guest buttons (row of guests), file buttons for the selected guest, **Clear screen**.
- Toggle like the tablet: press → live, press again → back to the default input.
- Video/audio transport: play/pause, from the start, ±10/30 s, go to time, markers (jump, add).
- Pulpit tablet: show a guest, go to a page.
- Variables such as `live_kind` (`none` / `photo` / `video` / `audio`) and `time_left_s` for Companion triggers, e.g. dim the DMX lights and open the playback channel on a Behringer Wing while a video plays.

Buttons are text only for now (file kind, duration and name).

See [companion/HELP.md](companion/HELP.md) for setup, all actions, variables and a trigger example.

## Requirements

- Vitrine agent 0.1.8 or newer (it has the **Integrations** API keys on its settings page).
- Companion 3.4 or newer (the module uses the Node 22 runtime).

## Install (until it is in the Companion module list)

1. Download `vitrine-x.y.z.tgz` from the [releases](https://github.com/silvansan/companion-module-vitrine/releases) (or build it, below).
2. In Companion: **Modules** → **Import module package** → choose the .tgz.
3. **Connections** → add **Vitrine**, enter the agent address, port 8090 and the API key.

## Build

```sh
npm install
npm test          # unit tests; add VITRINE_KEY=vik_... for a live test against an agent on 127.0.0.1:8090
npm run package   # writes vitrine-<version>.tgz
```

The GitHub workflow builds the .tgz on every push and attaches it to releases.

## Releasing

**Actions → release → Run workflow**, choose *patch*, *minor* or *major* (or type an exact version). It sets the version in `package.json`, tags it, creates the release and attaches `vitrine-x.y.z.tgz`.

## Getting into the official module list

Bitfocus hosts official modules under `github.com/bitfocus/companion-module-<manufacturer>-<product>`. Ask in the Companion Slack (#module-development) for a repository, move this code there, then submit a version through the Bitfocus developer portal. The module id (`vitrine`) can stay the same.

## License

MIT
