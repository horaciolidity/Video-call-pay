type MessageHandler = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private currentUserId: string | null = null;
  private currentRoomId: string | null = null;
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimer: any = null;
  private isExplicitlyClosed = false;

  public connect(userId?: string) {
    if (userId) this.currentUserId = userId;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.currentUserId && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'auth', userId: this.currentUserId });
      }
      return;
    }

    this.isExplicitlyClosed = false;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WS-Client] Connected to server');
        if (this.currentUserId) {
          this.send({ type: 'auth', userId: this.currentUserId });
        }
        if (this.currentRoomId) {
          this.send({ type: 'join_room', roomId: this.currentRoomId, userId: this.currentUserId });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type;
          if (type && this.listeners.has(type)) {
            this.listeners.get(type)!.forEach(handler => handler(data));
          }
          if (this.listeners.has('*')) {
            this.listeners.get('*')!.forEach(handler => handler(data));
          }
        } catch (e) {
          console.error('[WS-Client] Failed to parse incoming msg:', e);
        }
      };

      this.ws.onclose = () => {
        if (!this.isExplicitlyClosed) {
          console.warn('[WS-Client] Connection closed, reconnecting in 2.5s...');
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connect(), 2500);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[WS-Client] Socket error:', err);
      };
    } catch (e) {
      console.error('[WS-Client] Failed to create WebSocket:', e);
    }
  }

  public setUserId(userId: string | null) {
    this.currentUserId = userId;
    if (userId && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ type: 'auth', userId });
    }
  }

  public joinRoom(roomId: string, userId?: string) {
    this.currentRoomId = roomId;
    if (userId) this.currentUserId = userId;
    this.send({ type: 'join_room', roomId, userId: this.currentUserId });
  }

  public leaveRoom(roomId: string) {
    if (this.currentRoomId === roomId) {
      this.currentRoomId = null;
    }
    this.send({ type: 'leave_room', roomId });
  }

  public send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      // If not yet open, retry shortly
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(payload));
        }
      }, 500);
    }
  }

  public on(eventType: string, handler: MessageHandler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);
    return () => this.off(eventType, handler);
  }

  public off(eventType: string, handler: MessageHandler) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)!.delete(handler);
    }
  }

  public close() {
    this.isExplicitlyClosed = true;
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsClient = new WebSocketClient();
