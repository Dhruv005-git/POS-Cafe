import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/health`);
        setApiStatus(data);
      } catch {
        setApiStatus({ status: 'error', message: 'API unreachable' });
      } finally {
        setLoading(false);
      }
    };
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <motion.div
        className="max-w-2xl w-full"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl
                       bg-gradient-to-br from-primary-500 to-primary-700 mb-4 shadow-lg
                       shadow-primary-500/30"
            whileHover={{ scale: 1.05, rotate: 3 }}
          >
            <span className="text-4xl">☕</span>
          </motion.div>
          <h1 className="text-4xl font-display font-bold text-slate-100 tracking-tight">
            POS Cafe
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Restaurant Point of Sale — MERN Stack
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          {/* Backend Status */}
          <motion.div
            className="card p-5"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dark-900 flex items-center justify-center border border-slate-700/50">
                  <span className="text-lg">🔧</span>
                </div>
                <div>
                  <p className="font-medium text-slate-200">Backend API</p>
                  <p className="text-sm text-slate-500">http://localhost:5000</p>
                </div>
              </div>
              {loading ? (
                <div className="badge badge-warning animate-pulse">checking...</div>
              ) : apiStatus?.status === 'ok' ? (
                <div className="badge badge-success">● online</div>
              ) : (
                <div className="badge badge-danger">● offline</div>
              )}
            </div>
            {apiStatus && !loading && (
              <motion.div
                className="mt-3 pt-3 border-t border-slate-700/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-sm text-slate-400">{apiStatus.message}</p>
                {apiStatus.timestamp && (
                  <p className="text-xs text-slate-600 mt-1">
                    {new Date(apiStatus.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Build Info */}
          <motion.div
            className="card p-5"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-dark-900 flex items-center justify-center border border-slate-700/50">
                <span className="text-lg">📦</span>
              </div>
              <p className="font-medium text-slate-200">Stack Ready</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'React 18', color: 'text-cyan-400' },
                { label: 'Express 4', color: 'text-emerald-400' },
                { label: 'MongoDB', color: 'text-green-400' },
                { label: 'Socket.io', color: 'text-yellow-400' },
                { label: 'Tailwind', color: 'text-sky-400' },
                { label: 'Framer', color: 'text-pink-400' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-dark-900 rounded-lg p-2 text-center border border-slate-700/30"
                >
                  <span className={`text-xs font-medium ${item.color}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stage Progress */}
          <motion.div
            className="card p-5"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
          >
            <p className="font-medium text-slate-200 mb-3">Build Progress</p>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 min-w-[48px] h-8 rounded-md flex items-center
                              justify-center text-xs font-medium transition-colors
                              ${i === 0
                                ? 'bg-primary-500/30 border border-primary-500/60 text-primary-300'
                                : 'bg-dark-900 border border-slate-700/30 text-slate-600'
                              }`}
                >
                  S{i + 1}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Stage 1 of 10 complete
            </p>
          </motion.div>
        </div>

        <p className="text-center text-sm text-slate-600">
          Stage 1 — Project Setup ✓
        </p>
      </motion.div>
    </div>
  );
}