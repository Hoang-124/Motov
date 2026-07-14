import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/Motov';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find user by ID
    const user = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId('6a539eac7c526f1837024c05') });
    console.log('User found:', user);

    if (!user) {
      // Find user by any field matching "Thiên" or similar
      const similarUsers = await mongoose.connection.db.collection('users').find({
        $or: [
          { firstName: /Thiên/i },
          { lastName: /Thiên/i },
          { username: /thien/i }
        ]
      }).toArray();
      console.log('Similar users:', similarUsers);
    }

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
