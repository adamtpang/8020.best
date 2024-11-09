const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Purchase = require('../models/Purchase');

const migrateLists = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Using backend .env file');
    console.log('MONGO_URI exists:', !!process.env.MONGO_URI);

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in backend/.env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all purchases
    const purchases = await Purchase.find({});
    console.log(`Found ${purchases.length} purchases to migrate`);

    // First, let's see what we actually have in the database
    for (const purchase of purchases) {
      console.log('\nExamining purchase for:', purchase.email);
      console.log('Raw document:', JSON.stringify(purchase, null, 2));

      // Check all possible locations where trash data might be
      console.log('Checking possible trash locations:');
      console.log('purchase.lists?.trash:', purchase.lists?.trash);
      console.log('purchase.list4:', purchase.list4);
      console.log('purchase.trashedItems:', purchase.trashedItems);
    }

    console.log('\nNow performing migration...');

    // Now do the migration
    for (const purchase of purchases) {
      console.log(`\nMigrating purchase for email: ${purchase.email}`);

      // Prepare new data structure, checking all possible locations
      const updatedPurchase = {
        list1: purchase.list1 || purchase.lists?.list1 || [],
        list2: purchase.list2 || purchase.lists?.list2 || [],
        list3: purchase.list3 || purchase.lists?.list3 || [],
        list4: purchase.list4 || purchase.lists?.trash || purchase.trashedItems || []
      };

      // Update the document
      const result = await Purchase.updateOne(
        { _id: purchase._id },
        {
          $set: updatedPurchase,
          $unset: {
            lists: "",
            trashedItems: ""
          }
        }
      );

      console.log('Migration result:', result);
      console.log('Updated structure:', {
        list1Length: updatedPurchase.list1.length,
        list2Length: updatedPurchase.list2.length,
        list3Length: updatedPurchase.list3.length,
        list4Length: updatedPurchase.list4.length
      });
    }

    console.log('\nMigration complete');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateLists();