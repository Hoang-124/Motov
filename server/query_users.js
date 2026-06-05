import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  firstName: String,
  lastName: String,
  avatarUrl: String,
  phoneNumber: String,
});

const User = mongoose.model('User', UserSchema);

async function run() {
  try {
    await mongoose.connect('mongodb://localhost:27017/Motov');
    const users = await User.find({});
    console.log('Users in database:');
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
