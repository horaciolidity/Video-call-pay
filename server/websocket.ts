import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

interface ClientConnection {
  ws: WebSocket;
  userId?: string;
  roomId?: string;
}

const connections = new Set<ClientConnection>();
const userSockets = new Map<string, Set<WebSocket>>();
const roomParticipants = new Map<string, Set<WebSocket>>();

export function setupWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    const client: ClientConnection = { ws };
    connections.add(client);

    ws.on('message', (messageRaw: string) => {
      try {
        const data = JSON.parse(messageRaw.toString());
        const { type } = data;

        switch (type) {
          // User connects and registers their userId for notifications
          case 'auth': {
            const { userId } = data;
            if (userId) {
              client.userId = userId;
              if (!userSockets.has(userId)) {
                userSockets.set(userId, new Set());
              }
              userSockets.get(userId)!.add(ws);
              ws.send(JSON.stringify({ type: 'auth_success', userId }));
            }
            break;
          }

          // User joins a WebRTC video call room
          case 'join_room': {
            const { roomId, userId } = data;
            if (roomId) {
              client.roomId = roomId;
              client.userId = userId || client.userId;

              if (!roomParticipants.has(roomId)) {
                roomParticipants.set(roomId, new Set());
              }
              const room = roomParticipants.get(roomId)!;
              room.add(ws);

              // Notify existing members in this room that a new peer arrived
              room.forEach(peerWs => {
                if (peerWs !== ws && peerWs.readyState === WebSocket.OPEN) {
                  peerWs.send(JSON.stringify({
                    type: 'peer_joined',
                    roomId,
                    userId: client.userId,
                    participantCount: room.size,
                  }));
                }
              });

              ws.send(JSON.stringify({
                type: 'room_joined',
                roomId,
                participantCount: room.size,
              }));
            }
            break;
          }

          // WebRTC Signaling: Offer
          case 'webrtc_offer': {
            const { roomId, offer } = data;
            if (roomId && roomParticipants.has(roomId)) {
              roomParticipants.get(roomId)!.forEach(peerWs => {
                if (peerWs !== ws && peerWs.readyState === WebSocket.OPEN) {
                  peerWs.send(JSON.stringify({
                    type: 'webrtc_offer',
                    roomId,
                    offer,
                    senderId: client.userId,
                  }));
                }
              });
            }
            break;
          }

          // WebRTC Signaling: Answer
          case 'webrtc_answer': {
            const { roomId, answer } = data;
            if (roomId && roomParticipants.has(roomId)) {
              roomParticipants.get(roomId)!.forEach(peerWs => {
                if (peerWs !== ws && peerWs.readyState === WebSocket.OPEN) {
                  peerWs.send(JSON.stringify({
                    type: 'webrtc_answer',
                    roomId,
                    answer,
                    senderId: client.userId,
                  }));
                }
              });
            }
            break;
          }

          // WebRTC Signaling: ICE Candidate
          case 'webrtc_ice_candidate': {
            const { roomId, candidate } = data;
            if (roomId && roomParticipants.has(roomId)) {
              roomParticipants.get(roomId)!.forEach(peerWs => {
                if (peerWs !== ws && peerWs.readyState === WebSocket.OPEN) {
                  peerWs.send(JSON.stringify({
                    type: 'webrtc_ice_candidate',
                    roomId,
                    candidate,
                    senderId: client.userId,
                  }));
                }
              });
            }
            break;
          }

          // In-call media events (camera muted, microphone muted, flipped camera)
          case 'media_state_change': {
            const { roomId, state } = data;
            if (roomId && roomParticipants.has(roomId)) {
              roomParticipants.get(roomId)!.forEach(peerWs => {
                if (peerWs !== ws && peerWs.readyState === WebSocket.OPEN) {
                  peerWs.send(JSON.stringify({
                    type: 'peer_media_state',
                    roomId,
                    senderId: client.userId,
                    state,
                  }));
                }
              });
            }
            break;
          }

          // Leave room
          case 'leave_room': {
            const { roomId } = data;
            cleanUpRoom(client, roomId);
            break;
          }

          case 'ping': {
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('[WS] Error processing message:', err);
      }
    });

    ws.on('close', () => {
      connections.delete(client);
      if (client.userId && userSockets.has(client.userId)) {
        userSockets.get(client.userId)!.delete(ws);
        if (userSockets.get(client.userId)!.size === 0) {
          userSockets.delete(client.userId);
        }
      }
      if (client.roomId) {
        cleanUpRoom(client, client.roomId);
      }
    });

    ws.on('error', (err) => {
      console.warn('[WS] Socket error:', err.message);
    });
  });

  console.log('[WS] WebSocket server initialized on path /ws');
  return wss;
}

function cleanUpRoom(client: ClientConnection, roomId: string) {
  if (roomParticipants.has(roomId)) {
    const room = roomParticipants.get(roomId)!;
    room.delete(client.ws);
    // Notify other peers
    room.forEach(peerWs => {
      if (peerWs.readyState === WebSocket.OPEN) {
        peerWs.send(JSON.stringify({
          type: 'peer_left',
          roomId,
          userId: client.userId,
          participantCount: room.size,
        }));
      }
    });
    if (room.size === 0) {
      roomParticipants.delete(roomId);
    }
  }
}

// Push notification directly to a specific user (across all open tabs)
export function broadcastToUser(userId: string, payload: any) {
  const sockets = userSockets.get(userId);
  if (sockets && sockets.size > 0) {
    const msg = JSON.stringify(payload);
    sockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    });
    return true;
  }
  return false;
}

// Push notification to all peers in a call room
export function notifyCallRoom(roomId: string, payload: any) {
  const room = roomParticipants.get(roomId);
  if (room && room.size > 0) {
    const msg = JSON.stringify(payload);
    room.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    });
    return true;
  }
  return false;
}
