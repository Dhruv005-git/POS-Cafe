import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const TAX_RATE = 0.05;

function calcTotals(items) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  return { subtotal, tax, total: subtotal + tax };
}

export function useOrder(table, customerId = null) {
  const [orderId, setOrderId] = useState(null);       // DB order _id
  const [cartItems, setCartItems] = useState([]);      // local cart state (mirrors DB items)
  const [orderStatus, setOrderStatus] = useState('draft');
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // On mount: if table has a currentOrder, load it from DB
  useEffect(() => {
    const load = async () => {
      if (!table) { setLoadingOrder(false); return; }

      if (table.currentOrder) {
        try {
          const orderId = typeof table.currentOrder === 'object'
            ? table.currentOrder._id
            : table.currentOrder;
          const { data } = await api.get(`/orders/${orderId}`);
          const order = data.order;

          if (order && order.paymentStatus === 'unpaid') {
            setOrderId(order._id);
            setOrderStatus(order.status);
            // Map DB items into cart shape (add emoji from populated product)
            setCartItems(order.items.map(i => ({
              _id: i.product?._id || i.product,
              itemId: i._id,           // DB subdoc _id (for removal)
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              emoji: i.product?.emoji || '🍽️',
              notes: i.notes,
            })));
          }
        } catch {
          // No existing order or fetch failed — start fresh
        }
      }
      setLoadingOrder(false);
    };
    load();
  }, [table]);

  // Add item to cart (local state only — DB sync happens on "Send" or "Pay")
  const addToCart = useCallback((product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) {
        return prev.map(i =>
          i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, {
        _id: product._id,
        itemId: null,        // not yet in DB
        name: product.name,
        price: product.price,
        quantity: 1,
        emoji: product.emoji || '🍽️',
        notes: '',
      }];
    });
  }, []);

  const increment = useCallback((productId) => {
    setCartItems(prev =>
      prev.map(i => i._id === productId ? { ...i, quantity: i.quantity + 1 } : i)
    );
  }, []);

  const decrement = useCallback((productId) => {
    setCartItems(prev => {
      const item = prev.find(i => i._id === productId);
      if (!item) return prev;
      if (item.quantity === 1) return prev.filter(i => i._id !== productId);
      return prev.map(i => i._id === productId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  }, []);

  const remove = useCallback((productId) => {
    setCartItems(prev => prev.filter(i => i._id !== productId));
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  // Flush cart to DB: creates or merges order, returns orderId
  const flushToDb = async () => {
    if (cartItems.length === 0) return orderId;

    const payload = {
      tableId: table?._id,
      tableNumber: table?.number,
      customerId: customerId || null,
      items: cartItems.map(i => ({
        product: i._id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        emoji: i.emoji,
      })),
    };

    const { data } = await api.post('/orders', payload);
    const newId = data.order._id;
    setOrderId(newId);
    setCartItems(data.order.items.map(i => ({
      _id: i.product?._id || i.product,
      itemId: i._id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      emoji: i.product?.emoji || '🍽️',
    })));
    return newId;
  };

  const sendToKitchen = async () => {
    if (cartItems.length === 0) { toast.error('Cart is empty'); return false; }
    try {
      setActionLoading(true);
      const id = await flushToDb();
      await api.put(`/orders/${id}/send`);
      setOrderStatus('sent');
      toast.success('🍳 Order sent to kitchen!');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send order');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const pay = async (method = 'cash') => {
    if (cartItems.length === 0 && !orderId) { toast.error('No order to pay'); return false; }
    try {
      setActionLoading(true);
      const id = orderId || await flushToDb();
      await api.put(`/orders/${id}/pay`, { method });
      toast.success('✅ Payment successful!');
      setCartItems([]);
      setOrderId(null);
      setOrderStatus('paid');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const { subtotal, tax, total } = calcTotals(cartItems);

  return {
    cartItems,
    orderId,
    orderStatus,
    loadingOrder,
    actionLoading,
    subtotal,
    tax,
    total,
    addToCart,
    increment,
    decrement,
    remove,
    clearCart,
    sendToKitchen,
  };
}