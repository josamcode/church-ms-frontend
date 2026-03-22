import { useCallback, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken } from '../../auth/auth.store';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

export default function useChatSocket({
  enabled = true,
  onConnected,
  onMessage,
  onThreadRefresh,
  onThreadRemoved,
  onTyping,
} = {}) {
  const socketRef = useRef(null);
  const handlersRef = useRef({
    onConnected,
    onMessage,
    onThreadRefresh,
    onThreadRemoved,
    onTyping,
  });

  useEffect(() => {
    handlersRef.current = {
      onConnected,
      onMessage,
      onThreadRefresh,
      onThreadRemoved,
      onTyping,
    };
  }, [onConnected, onMessage, onThreadRefresh, onThreadRemoved, onTyping]);

  const emit = useCallback((eventName, payload) => {
    socketRef.current?.emit(eventName, payload);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const token = getAccessToken();
    if (!token) return undefined;

    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('chat:connected', (payload) => {
      handlersRef.current.onConnected?.(payload);
    });

    socket.on('chat:message:new', (payload) => {
      handlersRef.current.onMessage?.(payload);
    });

    socket.on('chat:thread:refresh', (payload) => {
      handlersRef.current.onThreadRefresh?.(payload);
    });

    socket.on('chat:thread:removed', (payload) => {
      handlersRef.current.onThreadRemoved?.(payload);
    });

    socket.on('chat:typing', (payload) => {
      handlersRef.current.onTyping?.(payload);
    });

    return () => {
      socketRef.current = null;
      socket.disconnect();
    };
  }, [enabled]);

  return { emit };
}
