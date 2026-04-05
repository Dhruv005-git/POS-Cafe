import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

// Centralized role → route mapping
export function getRoleRedirect(role) {
  switch (role) {
    case 'admin':    return '/admin/dashboard';
    case 'staff':    return '/pos/floor';
    case 'cashier':  return '/pos/floor';
    case 'customer': return '/customer';
    case 'kitchen':  return '/kitchen';
    default:         return '/pos/floor';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selected branch for staff — persisted per-user in localStorage
  const [selectedBranch, setSelectedBranchState] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('pos_token');
    const savedUser = localStorage.getItem('pos_user');
    if (token && savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      // Restore selected branch for this user
      const savedBranch = localStorage.getItem(`pos_branch_${u._id}`);
      if (savedBranch) setSelectedBranchState(JSON.parse(savedBranch));
    }
    setLoading(false);
  }, []);

  const setSelectedBranch = (branch) => {
    setSelectedBranchState(branch);
    if (user) {
      if (branch) {
        localStorage.setItem(`pos_branch_${user._id}`, JSON.stringify(branch));
      } else {
        localStorage.removeItem(`pos_branch_${user._id}`);
      }
    }
  };

  const signup = async (name, email, password, role = 'staff') => {
    const { data } = await api.post('/auth/signup', { name, email, password, role });
    localStorage.setItem('pos_token', data.token);
    localStorage.setItem('pos_user', JSON.stringify(data.user));
    setUser(data.user);
    toast.success(`Welcome, ${data.user.name}! 🎉`);
    return data;
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('pos_token', data.token);
    localStorage.setItem('pos_user', JSON.stringify(data.user));
    setUser(data.user);
    // Restore branch for this user
    const savedBranch = localStorage.getItem(`pos_branch_${data.user._id}`);
    if (savedBranch) setSelectedBranchState(JSON.parse(savedBranch));
    toast.success(`Welcome back, ${data.user.name}! ☕`);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    setUser(null);
    setSelectedBranchState(null);
    toast.success('Logged out');
  };

  return (
    <AuthContext.Provider value={{
      user, loading, signup, login, logout,
      getRoleRedirect,
      selectedBranch, setSelectedBranch,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};