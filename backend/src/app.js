import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import productRouter from './routes/products.js';
import tableRouter from './routes/tables.js';
import orderRouter from './routes/orders.js';
import sessionRouter from './routes/sessions.js';
import settingsRouter from './routes/settings.js';
import reportsRouter from './routes/reports.js';
import branchRouter from './routes/branches.js';
import floorRouter from './routes/floors.js';
import customerRouter from './routes/customers.js';
import categoryRouter from './routes/categories.js';
import menuRouter     from './routes/menu.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.set('io', io);

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/tables', tableRouter);
app.use('/api/orders', orderRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/branches', branchRouter);
app.use('/api/floors', floorRouter);
app.use('/api/customers', customerRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/menu',      menuRouter);

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const start = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
  });
};
start();