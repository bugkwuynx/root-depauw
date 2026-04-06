// core-backend/src/test-firestore.ts
import { db } from '../database/configFirestore.js';

async function testConnection() {
  try {
    // Write a test document
    await db.collection('test').doc('ping').set({
      message: 'Hello Firestore!',
      timestamp: new Date(),
    });
    console.log('✅ Write successful');

    // Read it back
    const doc = await db.collection('test').doc('ping').get();
    console.log('✅ Read successful:', doc.data());

    // Clean up
    await db.collection('test').doc('ping').delete();
    console.log('✅ Deleted test document');

    console.log('\n🎉 Firestore connection is working!');
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();