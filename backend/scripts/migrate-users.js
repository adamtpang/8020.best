require('dotenv').config({
    path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});

const mongoose = require('mongoose');

const oldUsers = [
    {
        email: "alex.dobrenko@gmail.com",
        hasPurchased: true,
        purchaseDate: new Date("2024-03-09T22:23:35.488Z"),
        stripeSessionId: "cs_live_a1JG5FJMlB9uU1zgH9EvvE1XBdKPco3WiT88KrhUZgAgHPdNJ2zYS6k74z",
        list1: [],
        list2: [],
        list3: [
            "1,1,fill out insurance info on duck app",
            "1,1,send esther a pitch case study",
            "1,1,respond to the lady 1"
        ]
    },
    {
        email: "ryaanaqid@gmail.com",
        hasPurchased: true,
        purchaseDate: new Date("2024-03-10T08:29:43.641Z"),
        stripeSessionId: "cs_live_a1NsILzuAGYLZTgkr9sy619wYcQhIsNluMv0Decu454LS9UGnTpL5RZ9Wp",
        list1: [],
        list2: [],
        list3: []
    },
    {
        email: "steve@educatorsteve.com",
        hasPurchased: true,
        purchaseDate: new Date("2024-03-10T09:14:13.403Z"),
        stripeSessionId: "cs_live_a1dd2s9E6J6i0XMhyjO7Bnxzw3Wyk6g6mvkSNxwIEX47CEc3mbDbZO9DHx",
        list1: [],
        list2: [],
        list3: []
    },
    {
        email: "migueljtnandez@gmail.com",
        hasPurchased: true,
        purchaseDate: new Date("2024-03-11T11:16:34.422Z"),
        stripeSessionId: "cs_live_a1gLZj1uJ50Zsm43jjVbVVMiHFaGubDYkjCRP7WYAaE1bEvo0eGH0cUtX0",
        list1: ["0,1,dinner", "0,1,worm", "0,0,school"],
        list2: [],
        list3: ["0,1,dinner", "0,1,worm", "0,0,school"]
    }
];

async function migrateUsers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('users');

        for (const user of oldUsers) {
            console.log(`\nMigrating user: ${user.email}`);

            // Check if user already exists
            const existingUser = await collection.findOne({ email: user.email });
            if (existingUser) {
                console.log(`User ${user.email} already exists, skipping...`);
                continue;
            }

            // Insert the user with the new format
            const result = await collection.insertOne({
                email: user.email,
                hasPurchased: user.hasPurchased,
                purchaseDate: user.purchaseDate,
                stripeSessionId: user.stripeSessionId,
                list1: user.list1 || [],
                list2: user.list2 || [],
                list3: user.list3 || []
            });

            console.log(`Successfully migrated user: ${user.email}`);
        }

        console.log('\nMigration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

migrateUsers();