import { WebSocketServer } from 'ws';

const port = Number(process.env.PORT ?? 8787);
const token = process.env.HUI_GATEWAY_TOKEN ?? 'development-only-token';
const maxMessageBytes = 256 * 1024;
const wss = new WebSocketServer({ port, maxPayload: maxMessageBytes });

const wireEvent = (type, payload, correlationId, sessionId) => JSON.stringify({
  protocol: 'hui/1.0', kind: 'EVENT', event: {
    protocol: 'hui/1.0', id: crypto.randomUUID(), type, timestamp: Date.now(), payload,
    ...(correlationId ? { correlationId } : {}), ...(sessionId ? { sessionId } : {})
  }
});

wss.on('connection', (socket) => {
  let authenticated = false;
  let clientNonce = null;
  const sessionId = crypto.randomUUID();

  socket.on('message', raw => {
    if (Buffer.byteLength(raw) > maxMessageBytes) { socket.close(1009, 'message_too_large'); return; }
    let message;
    try { message = JSON.parse(String(raw)); } catch { socket.send(wireEvent('ERROR', { code: 'invalid_json' }, undefined, sessionId)); return; }

    if (message?.kind === 'HELLO') {
      clientNonce = message.clientNonce;
      socket.send(wireEvent('AUTH_REQUIRED', { mechanism: 'bearer', sessionId }, undefined, sessionId));
      return;
    }
    if (message?.kind === 'AUTH') {
      if (!clientNonce || message.clientNonce !== clientNonce || message.token !== token) {
        socket.close(1008, 'authentication_failed'); return;
      }
      authenticated = true;
      socket.send(wireEvent('READY', { connector: 'mock-gateway', secureExecution: false }, undefined, sessionId));
      return;
    }
    if (message?.kind !== 'COMMAND' || !authenticated) { socket.close(1008, 'not_authenticated'); return; }

    const command = message.command;
    if (command?.type === 'CORE_STATE') socket.send(wireEvent('AI_STATE', { state: command.payload?.state ?? 'idle' }, command.correlationId, sessionId));
    if (command?.type === 'CARD_ARRANGE') socket.send(wireEvent('NOTIFY', { message: 'Gateway accepted CARD_ARRANGE.' }, command.correlationId, sessionId));
    if (command?.type === 'REQUEST_APPROVAL') socket.send(wireEvent('APPROVAL_REQUESTED', { status: 'pending', request: command.payload }, command.id, sessionId));
  });
});

console.log(`Holographic UI mock gateway listening on ws://localhost:${port}`);
console.log('Development token is configurable through HUI_GATEWAY_TOKEN and must never be used in production.');
