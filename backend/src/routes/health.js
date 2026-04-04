import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '🍕 POS Cafe API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;