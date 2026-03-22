import { useCallback, useEffect, useState } from 'react';
import { pushApi } from '../../api/endpoints';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}

async function ensureServiceWorkerRegistration() {
  const serviceWorkerPath = `${process.env.PUBLIC_URL || ''}/sw.js`;
  const registration = await navigator.serviceWorker.register(serviceWorkerPath);
  await registration.update().catch(() => undefined);
  return navigator.serviceWorker.ready;
}

export default function usePushNotifications({ enabled = true } = {}) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'default'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const syncStatus = useCallback(async (shouldResubscribe = false) => {
    const isSupported =
      typeof window !== 'undefined' &&
      window.isSecureContext &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setSupported(isSupported);
    setPermission(isSupported ? window.Notification.permission : 'default');

    if (!enabled || !isSupported) {
      setSubscribed(false);
      return false;
    }

    const registration = await ensureServiceWorkerRegistration();
    const subscription = await registration.pushManager.getSubscription();

    if (subscription && shouldResubscribe) {
      await pushApi.subscribe({
        subscription: subscription.toJSON ? subscription.toJSON() : subscription,
        userAgent: navigator.userAgent,
      });
    }

    setSubscribed(Boolean(subscription));
    return Boolean(subscription);
  }, [enabled]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        await syncStatus(true);
      } catch (syncError) {
        if (!active) return;
        setError(syncError?.response?.data?.message || syncError?.message || 'Failed to sync push status.');
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [syncStatus]);

  const enablePush = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const isSupported =
        typeof window !== 'undefined' &&
        window.isSecureContext &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      if (!isSupported) {
        throw new Error('Push notifications are not supported in this browser or context.');
      }

      const registration = await ensureServiceWorkerRegistration();
      const permissionResult = await window.Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        throw new Error('Notification permission was not granted.');
      }

      const { data } = await pushApi.getPublicKey();
      const publicKey = data?.data?.publicKey;

      if (!publicKey) {
        throw new Error('Push public key is missing from the server response.');
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      await pushApi.subscribe({
        subscription: subscription.toJSON ? subscription.toJSON() : subscription,
        userAgent: navigator.userAgent,
      });

      setSubscribed(true);
      return true;
    } catch (enableError) {
      setError(enableError?.response?.data?.message || enableError?.message || 'Failed to enable push notifications.');
      throw enableError;
    } finally {
      setLoading(false);
    }
  }, []);

  const disablePush = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (!('serviceWorker' in navigator)) {
        setSubscribed(false);
        return true;
      }

      const registration = await ensureServiceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();

      if (subscription?.endpoint) {
        await pushApi.unsubscribe({
          endpoint: subscription.endpoint,
        });
        await subscription.unsubscribe();
      }

      setSubscribed(false);
      return true;
    } catch (disableError) {
      setError(disableError?.response?.data?.message || disableError?.message || 'Failed to disable push notifications.');
      throw disableError;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    supported,
    subscribed,
    permission,
    loading,
    error,
    enablePush,
    disablePush,
    refresh: syncStatus,
  };
}
