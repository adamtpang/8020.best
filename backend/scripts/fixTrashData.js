const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Purchase = require('../models/Purchase');

const fixTrashData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const purchases = await Purchase.find({});
    console.log(`Found ${purchases.length} purchases`);

    for (const purchase of purchases) {
      console.log('\nFixing purchase for:', purchase.email);

      // Initialize list4 if it doesn't exist
      if (!purchase.list4) {
        console.log('Initializing list4 array');
        purchase.list4 = [];
        await purchase.save();
      }

      // Move any items from old trash location to list4
      if (purchase.lists?.trash) {
        console.log('Moving items from lists.trash to list4');
        purchase.list4 = [...purchase.lists.trash, ...purchase.list4];
        purchase.lists.trash = undefined;
        await purchase.save();
      }

      // Remove old lists structure
      if (purchase.lists) {
        console.log('Removing old lists structure');
        purchase.lists = undefined;
        await purchase.save();
      }

      console.log('Updated structure:', {
        list1Length: purchase.list1?.length || 0,
        list2Length: purchase.list2?.length || 0,
        list3Length: purchase.list3?.length || 0,
        list4Length: purchase.list4?.length || 0
      });
    }

    console.log('\nMigration complete');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixTrashData();