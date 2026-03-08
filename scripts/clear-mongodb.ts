import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://vagishd_db_user:yIVgngLIbPDaIUfW@iterations-v1-test.butz7tt.mongodb.net/senate?retryWrites=true&w=majority';

async function clearAllData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    console.log('\n🗑️  Clearing all collections...');
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`   Dropping: ${collectionName}`);
      await db.dropCollection(collectionName);
    }

    console.log('\n✨ All MongoDB data cleared successfully!');
    console.log(`   Dropped ${collections.length} collection(s)\n`);

    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB\n');
  } catch (error) {
    console.error('❌ Error clearing MongoDB:', error);
    process.exit(1);
  }
}

clearAllData();
