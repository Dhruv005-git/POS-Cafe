/**
 * useBroadcast — wraps the BroadcastChannel API for cross-tab POS → Customer Display comms.
 * All tabs on the same origin share the 'pos_customer_display' channel.
 */
import { useEffect, useCallback, useRef } from 'react';

const CHANNEL_NAME = 'pos_customer_display';

// Send a message to all customer display tabs
export function broadcastToDisplay(payload) {
  try {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    ch.postMessage(payload);
    ch.close();
  } catch {
    // BroadcastChannel not supported (very rare) — silent fail
  }
}

// Listen for messages on the customer display channel
export function useBroadcastListener(handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    let ch;
    try {
      ch = new BroadcastChannel(CHANNEL_NAME);
      ch.onmessage = (e) => handlerRef.current(e.data);
    } catch { /* not supported */ }
    return () => ch?.close();
  }, []);
}
