import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/Motov');
  const db = mongoose.connection.db;
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  // Find all Suzuki Raider / Satria 150 bookings for this user
  const userId = new mongoose.Types.ObjectId('6a223b4bb8081481db32a122');
  
  // We want to keep BK20260630634472 and delete other duplicates of Raider created around the same time
  const res = await db.collection('bookings').deleteMany({
    userId: userId,
    'vehicleSnapshot.name': 'Suzuki Raider / Satria 150',
    bookingCode: { $ne: 'BK20260630634472' }
  });

  console.log('Deleted duplicate bookings count:', res.deletedCount);
  process.exit(0);
}

run().catch(console.error);
