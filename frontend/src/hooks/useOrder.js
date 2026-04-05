import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { broadcastToDisplay } from './useBroadcast.js';

// Per-item tax + optional price override + discount + selected extras
function calcTotals(items, defaultTaxRate = 0.05) {
  let subtotal = 0;
  let tax = 0;
  let discountTotal = 0;
  for (const i of items) {
    const basePrice    = i.priceOverride != null ? i.priceOverride : i.price;
    const discFrac     = (i.discount || 0) / 100;
    const effectiveBase = basePrice * (1 - discFrac);
    const extrasTotal  = (i.selectedExtras || []).reduce((s, e) => s + e.price, 0);
    const effectiveP   = effectiveBase + extrasTotal;   // extras are not discounted
    const lineTotal    = effectiveP * i.quantity;
    const discounted   = (basePrice - effectiveBase) * i.quantity;
    const rate         = (i.tax > 0 ? i.tax : defaultTaxRate * 100) / 100;
    subtotal       += lineTotal;
    tax            += lineTotal * rate;
    discountTotal  += discounted;
  }
  return { subtotal, tax, total: subtotal + tax, discountTotal };
}

export function useOrder(table, customerId = null) {
  const [orderId, setOrderId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [orderStatus, setOrderStatus] = useState('draft');
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [defaultTaxRate, setDefaultTaxRate] = useState(0.05); // from settings

  // Fetch default tax rate from settings once
  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      if (data.taxRate != null) setDefaultTaxRate(data.taxRate / 100); // API returns % (e.g. 5), calcTotals needs decimal (0.05)
    }).catch(() => {});
  }, []);

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
            setCartItems(order.items.map(i => ({
              _id: i.product?._id || i.product,
              itemId: i._id,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              emoji: i.product?.emoji || '🍽️',
              tax: i.product?.tax ?? 0,
              notes: i.notes || '',
              priceOverride: i.priceOverride ?? null,
              discount: i.discount ?? 0,
              availableExtras: i.product?.extras || [],
              selectedExtras: i.selectedExtras || [],
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
        itemId: null,
        name: product.name,
        price: product.price,
        quantity: 1,
        emoji: product.emoji || '🍽️',
        tax: product.tax ?? 0,
        notes: '',
        priceOverride: null,
        discount: 0,
        availableExtras: product.extras || [],
        selectedExtras: [],
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

  // Edit notes / price override / discount for a specific item
  const editItem = useCallback((productId, changes) => {
    setCartItems(prev => prev.map(i =>
      i._id === productId ? { ...i, ...changes } : i
    ));
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  // Full reset for register mode — clears cart + order state for next customer
  const resetOrder = useCallback(() => {
    setCartItems([]);
    setOrderId(null);
    setOrderStatus('draft');
  }, []);

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
        notes: i.notes || '',
        priceOverride: i.priceOverride ?? null,
        discount: i.discount ?? 0,
        selectedExtras: i.selectedExtras || [],
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
      tax: i.product?.tax ?? 0,
      notes: i.notes || '',
      priceOverride: i.priceOverride ?? null,
      discount: i.discount ?? 0,
      availableExtras: i.product?.extras || [],
      selectedExtras: i.selectedExtras || [],
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

  const { subtotal, tax, total, discountTotal } = calcTotals(cartItems, defaultTaxRate);

  // Broadcast cart to customer display whenever it changes
  useEffect(() => {
    if (cartItems.length === 0) return;
    broadcastToDisplay({
      type: 'bill',
      order: { items: cartItems, subtotal, tax, total, discountTotal },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems]);

  return {
    cartItems,
    orderId,
    orderStatus,
    loadingOrder,
    actionLoading,
    subtotal,
    tax,
    total,
    discountTotal,
    defaultTaxRate,
    addToCart,
    increment,
    decrement,
    remove,
    editItem,
    clearCart,
    resetOrder,
    sendToKitchen,
    pay,
  };
}