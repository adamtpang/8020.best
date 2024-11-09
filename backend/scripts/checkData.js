const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Purchase = require('../models/Purchase');

const checkData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const purchases = await Purchase.find({});
    console.log(`Found ${purchases.length} purchases`);

    for (const purchase of purchases) {
      console.log('\nPurchase for:', purchase.email);
      console.log('Raw data:', JSON.stringify(purchase, null, 2));
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

checkData();