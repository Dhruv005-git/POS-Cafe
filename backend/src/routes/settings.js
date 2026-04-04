import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    upiId: process.env.UPI_ID || 'cafe@ybl',
    cafeName: 'POS Cafe',
    taxRate: 0.05,
    currency: 'USD',
  });
});

export default router;