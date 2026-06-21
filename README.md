# sim-phi-embed

> Embeddable wrapper around [SimPhiCore](https://github.com/lchzh3473/sim-phi) — the web-based Phigros simulator by [lchzh3473](https://github.com/lchzh3473).  
> Adds an iframe-based embed API (`SimPhiEmbed`) for loading charts and controlling playback from any page.

## Usage

```ts
import { SimPhiEmbed } from './embed.js';

const player = new SimPhiEmbed(document.getElementById('container'));
player.post(pezFile);               // send a .pez File
player.play();                       // start playback
player.pause();                      // pause
player.seek(30);                     // seek to 30s
player.setAutoPlay(true);            // toggle auto-play
player.onStatus(s => console.log(s.state, s.time, s.score));
```

Open `dist/demo-embed.html` for a minimal working example.

## Embed API

| Method | Description |
|--------|-------------|
| `post(data)` | Send a File or action object to the iframe |
| `play()` | Start/resume playback |
| `pause()` | Pause |
| `stop()` | Stop and reset |
| `seek(timeSec)` | Seek to position |
| `setAutoPlay(bool)` | Toggle auto-play mode |
| `getStatus()` | Request current status |
| `onStatus(cb)` | Subscribe to status updates |
| `onReady(cb)` | Called when iframe has loaded |
| `destroy()` | Clean up and remove iframe |

## Embed Chart

[SimPhiCore](https://github.com/lchzh3473/sim-phi) — Copyright &copy; 2020-present, lchzh3473  
This repository is a derivative work under [GPL-3.0](LICENSE.txt).
