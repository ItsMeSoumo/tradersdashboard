import mongoose from 'mongoose';

// Define the trader schema
const traderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    trim: true,
  },
  totalTrades: {
    type: Number,
    default: 0,
  },
  profitGenerated: {
    type: Number,
    default: 0,
  },
  assignedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVerified: {
    type: Boolean,
    default: true,
  },
  clients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  role: {
    type: String,
    enum: ['user', 'trader'],
    default: 'trader',
  },
  password: {
    type: String,
    required: true, // Make it optional for flexibility
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Delete old model if it exists to prevent OverwriteModelError
const Trader = mongoose.models.Trader || mongoose.model('Trader', traderSchema);

export default Trader;
