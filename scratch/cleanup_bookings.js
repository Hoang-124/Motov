import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/Motov');
  const db = mongoose.connection.db;
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  // 1. Find all active ongoing bookings (rented and in-use right now)
  const ongoingBookings = await db.collection('bookings').find({ status: 'Ongoing' }).toArray();
  const activeRentedVehicleIds = ongoingBookings.map(b => b.vehicleId.toString());
  
  console.log('Active Ongoing Booking count:', ongoingBookings.length);
  console.log('Vehicle IDs currently in-use:', activeRentedVehicleIds);

  // 2. Fetch all vehicles
  const vehicles = await db.collection('vehicles').find({}).toArray();
  
  let updatedCount = 0;
  for (const vehicle of vehicles) {
    const isCurrentlyRented = activeRentedVehicleIds.includes(vehicle._id.toString());
    const expectedStatus = isCurrentlyRented ? 'Rented' : 'Available';
    
    if (vehicle.status !== expectedStatus) {
      await db.collection('vehicles').updateOne(
        { _id: vehicle._id },
        { $set: { status: expectedStatus } }
      );
      console.log(`Updated vehicle ${vehicle.vehicleModel || vehicle.licensePlate} (${vehicle._id}) status from ${vehicle.status} -> ${expectedStatus}`);
      updatedCount++;
    }
  }

  console.log(`Successfully completed migration! Updated ${updatedCount} vehicle statuses.`);
  process.exit(0);
}

run().catch(console.error);
