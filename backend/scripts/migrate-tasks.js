require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('../models/Task');

async function migrateTasks() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Get all users with tasks
        const users = await mongoose.connection.collection('users').find({}).toArray();
        console.log(`Found ${users.length} users to process`);

        for (const user of users) {
            console.log(`\nProcessing user: ${user.email}`);

            // Skip if user has no tasks
            if (!user.list1 && !user.list2 && !user.list3) {
                console.log('No tasks found, skipping...');
                continue;
            }

            // Create task document
            await Task.create({
                userId: user._id.toString(),
                tasks: {
                    list1: user.list1 || [],
                    list2: user.list2 || [],
                    list3: user.list3 || []
                }
            });

            // Remove task lists from user document
            await mongoose.connection.collection('users').updateOne(
                { _id: user._id },
                {
                    $unset: {
                        list1: "",
                        list2: "",
                        list3: ""
                    }
                }
            );

            console.log(`Successfully migrated tasks for user: ${user.email}`);
        }

        console.log('\nMigration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run migration
migrateTasks();