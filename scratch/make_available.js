import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/Motov');
  const db = mongoose.connection.db;
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }
  const res = await db.collection('vehicles').updateOne(
    { vehicleModel: 'Honda Rebel 300 / 500' },
    { $set: { status: 'Available' } }
  );
  console.log('Update result:', res);
  process.exit(0);
}

run().catch(console.error);
