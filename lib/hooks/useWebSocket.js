'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
export function useWebSocket(url, options = {}) {
  const {
    onMessage,
    reconnectDelay = 3000,
    maxReconnects = 5,
    enabled = true
  } = options;
  const [status, setStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef();
  const connect = useCallback(() => {
    if (!url || !enabled || typeof window === 'undefined') return;
    try {
      setStatus('connecting');
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => {
        setStatus('connected');
        reconnectCount.current = 0;
      };
      ws.onmessage = event => {
        try {
          const msg = JSON.parse(event.data);
          setLastMessage(msg);
          onMessage?.(msg);
        } catch {
          // Non-JSON message
        }
      };
      ws.onerror = () => setStatus('error');
      ws.onclose = () => {
        setStatus('disconnected');
        if (reconnectCount.current < maxReconnects) {
          reconnectCount.current++;
          reconnectTimer.current = setTimeout(connect, reconnectDelay);
        }
      };
    } catch {
      setStatus('error');
    }
  }, [url, enabled, onMessage, reconnectDelay, maxReconnects]);
  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('disconnected');
  }, []);
  const send = useCallback(data => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);
  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);
  return {
    status,
    lastMessage,
    send,
    disconnect,
    reconnect: connect
  };
}
