// frontend/src/utils/toast.js
// Centralized toast calls so every part of the app uses consistent styling
import toast from 'react-hot-toast';

export const notify = {
  success: (msg) => toast.success(msg),
  error:   (msg) => toast.error(msg, {
    iconTheme: { primary: '#f43f5e', secondary: '#fff' },
    style: {
      background: '#1e293b',
      color: '#f1f5f9',
      border: '1px solid rgba(244,63,94,0.3)',
      borderRadius: '12px',
    },
  }),
  loading: (msg) => toast.loading(msg),
  dismiss: (id)  => toast.dismiss(id),

  order: (orderNumber, table) => toast.success(
    `Order ${orderNumber} sent to kitchen${table ? ` · Table ${table}` : ''}`,
    { icon: '🍳', duration: 3000 }
  ),

  payment: (method, amount) => {
    const icons = { cash: '💵', card: '💳', upi: '📱' };
    toast.success(`Payment of $${amount.toFixed(2)} received via ${method}`, {
      icon: icons[method] || '✅',
      duration: 4000,
    });
  },

  kitchenNew: () => toast('New order in kitchen!', {
    icon: '🔔',
    duration: 2500,
    style: {
      background: '#172033',
      color: '#f1f5f9',
      border: '1px solid rgba(99,102,241,0.4)',
      borderRadius: '12px',
    },
  }),
};