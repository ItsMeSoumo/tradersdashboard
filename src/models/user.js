import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the user schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password should be at least 6 characters long']
  },
  isVerified: {
    type: Boolean,
    default: true,
  },
  isAcceptingMessages: {
    type: Boolean,
    default: true,
  },
  role: {
    type: String,
    enum: ['user', 'trader', 'admin'],
    default: 'user',
  },
  money: {
    type: Number,
    default: 0,
  },
  presentmoney: {
    type: Number,
    default: 0,
  },
  profit: {
    type: Number,
    default: 0,
  },
  transactions: [{
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'profit', 'loss'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password with salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// Delete old model if it exists to prevent OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
