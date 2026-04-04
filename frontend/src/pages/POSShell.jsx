import { useAuth } from '../context/AuthContext.jsx';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';

export default function POSShell() {
  return <Navigate to="/pos/floor" replace />;
}