// Space Explorer — WebSocket multiplayer server
// Run: node server.js   (requires: npm install)
'use strict';

const { WebSocketServer } = require('ws');
const PORT = 8080;
const wss  = new WebSocketServer({ port: PORT });

const players = new Map();  // id → { ws, data }
let nextId = 1;

function broadcast(except = null) {
  const payload = JSON.stringify({
    t: 'state',
    p: Object.fromEntries([...players.entries()].map(([id,pl]) => [id, pl.data])),
  });
  for (const [, pl] of players) {
    if (pl.ws !== except && pl.ws.readyState === 1) {
      pl.ws.send(payload);
    }
  }
  // Also send to the excluded socket so it sees everyone (including itself)
  if (except && except.readyState === 1) except.send(payload);
}

wss.on('connection', ws => {
  const id = String(nextId++);

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.t === 'join') {
      players.set(id, {
        ws,
        data: { id, name: String(msg.name).slice(0,14), col: String(msg.col), x:0, y:0, a:0, thr:0 },
      });
      ws.send(JSON.stringify({ t: 'hi', id }));
      broadcast();
    } else if (msg.t === 'mv') {
      const pl = players.get(id);
      if (!pl) return;
      pl.data.x   = +msg.x || 0;
      pl.data.y   = +msg.y || 0;
      pl.data.a   = +msg.a || 0;
      pl.data.thr = +msg.thr || 0;
      broadcast();
    }
  });

  ws.on('close', () => {
    players.delete(id);
    broadcast();
  });

  ws.on('error', () => { players.delete(id); });
});

console.log(`Space Explorer multiplayer server → ws://localhost:${PORT}`);
console.log('Players will share real-time positions in the same universe.');
