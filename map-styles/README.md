# Map styles

MapLibre styles for the BuildTheEarth map base layers, hosted on `https://tiles.dachstein.cloud`. Both use the OpenMapTiles schema from `planet.json` and are structurally identical, only the paint colors differ.

| File                 | Hosted at                                                       |
| -------------------- | --------------------------------------------------------------- |
| `bteextradark.json`  | `https://tiles.dachstein.cloud/styles/bteextradark/style.json`  |
| `bteextralight.json` | `https://tiles.dachstein.cloud/styles/bteextralight/style.json` |

These files are the source of truth. After changing them, upload them to the tile server (as `style.json` in the matching `styles/<name>/` folder).

## Dashboard configuration

The dashboard reads its base layers from `NEXT_PUBLIC_MAP_STYLE_URL`, a comma separated list of `Name|URL` entries. The special value `satellite` adds Mapbox satellite imagery and needs `NEXT_PUBLIC_MAPBOX_TOKEN` (it is skipped without it):

```
Light|https://tiles.dachstein.cloud/styles/bteextralight/style.json,Dark|https://tiles.dachstein.cloud/styles/bteextradark/style.json,Satellite|satellite
```
