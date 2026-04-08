import { WebSocketServer,WebSocket } from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '@repo/backend-common';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws:WebSocket, request:any) {
  const url = request.url;
  console.log(`New WebSocket connection: ${url}`);

  if(!url) {
    ws.close(1008, 'Missing URL');
    return;
  }

  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token');

  if (!token) {
    ws.close(1008, 'Missing token');
    return;
  }

  const decoded = jwt.verify(token, JWT_SECRET);

  if(!decoded || typeof decoded === 'string' || !(decoded as JwtPayload).userId) {
    ws.close();
    return;
  }

  ws.on('error', console.error);

  ws.on('message', function message(e:any) {
    console.log('received: %s', e);
    ws.send('pong');
  });

});