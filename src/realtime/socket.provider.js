import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '../auth/auth.hooks';
import { clearAuth, AUTH_TOKENS_CHANGED_EVENT, getAccessToken } from '../auth/auth.store';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());
  const [connected, setConnected] = useState(false);
  const [socketToken, setSocketToken] = useState(() => getAccessToken());

  const emit = useCallback((eventName, payload) => {
    socketRef.current?.emit(eventName, payload);
  }, []);

  const subscribe = useCallback((eventName, handler) => {
    if (!eventName || typeof handler !== 'function') {
      return () => {};
    }

    let handlers = listenersRef.current.get(eventName);
    if (!handlers) {
      handlers = new Set();
      listenersRef.current.set(eventName, handlers);
    }

    handlers.add(handler);
    if (socketRef.current) {
      socketRef.current.on(eventName, handler);
    }

    return () => {
      const currentHandlers = listenersRef.current.get(eventName);
      if (!currentHandlers) return;

      currentHandlers.delete(handler);
      if (socketRef.current) {
        socketRef.current.off(eventName, handler);
      }

      if (currentHandlers.size === 0) {
        listenersRef.current.delete(eventName);
      }
    };
  }, []);

  useEffect(() => {
    const syncToken = () => {
      setSocketToken(getAccessToken());
    };

    syncToken();

    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleTokensChanged = (event) => {
      setSocketToken(event?.detail?.accessToken || getAccessToken());
    };

    const handleStorage = (event) => {
      if (!event.key || event.key === 'church_access_token') {
        syncToken();
      }
    };

    window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, handleTokensChanged);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, handleTokensChanged);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !socketToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: { token: socketToken },
      transports: ['websocket', 'polling'],
    });
    const listeners = listenersRef.current;

    socketRef.current = socket;

    listeners.forEach((handlers, eventName) => {
      handlers.forEach((handler) => {
        socket.on(eventName, handler);
      });
    });

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleConnectError = () => setConnected(false);

    // ── auth:revoked — server forcibly ended this session ──
    const handleAuthRevoked = (payload = {}) => {
      const reasonMessages = {
        account_locked: 'Your account has been locked. Please contact an administrator.',
        account_disabled: 'Your account has been disabled. Please contact an administrator.',
        auth_version_changed: 'Your session has been invalidated. Please sign in again.',
        deleted: 'Your account has been deactivated. Please contact an administrator.',
        no_login: 'Your account does not currently have sign-in access.',
      };
      const message =
        reasonMessages[payload?.reason] ||
        'Your session has expired. Please sign in again.';

      // Clear all local auth state
      clearAuth();

      // Show a user-facing message
      try {
        toast.error(message, { duration: 6000 });
      } catch (_e) {
        // toast may unmount before showing; best-effort
      }

      // Redirect to login — full page load guarantees clean state
      window.location.href = '/auth/login';
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('auth:revoked', handleAuthRevoked);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('auth:revoked', handleAuthRevoked);
      listeners.forEach((handlers, eventName) => {
        handlers.forEach((handler) => {
          socket.off(eventName, handler);
        });
      });
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      setConnected(false);
    };
  }, [isAuthenticated, socketToken]);

  const value = useMemo(
    () => ({
      connected,
      emit,
      subscribe,
    }),
    [connected, emit, subscribe]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useAppSocket() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error('useAppSocket must be used within SocketProvider');
  }

  return context;
}

export function useSocketEvent(eventName, handler, enabled = true) {
  const { subscribe } = useAppSocket();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled || !eventName || typeof handlerRef.current !== 'function') {
      return undefined;
    }

    return subscribe(eventName, (payload) => {
      handlerRef.current?.(payload);
    });
  }, [enabled, eventName, subscribe]);
}
