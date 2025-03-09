const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const purchaseRoutes = require('./routes/purchases');
const aiRoutes = require('./routes/ai');
const { verifyToken } = require('./middleware/auth');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
    console.error('MongoDB URI is not defined in environment variables');
    process.exit(1);
}

mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Public routes (no auth required)
app.use('/api/ai', aiRoutes);

// Protected routes (require auth)
app.use('/api/admin', verifyToken, adminRoutes);
app.use('/api/auth', verifyToken, authRoutes);
app.use('/api/purchases', verifyToken, purchaseRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});