import { connectDB } from '@/dbConfig/dbConfig.js';
import User from '@/models/user.js';
import bcrypt from 'bcryptjs';
import { debugPasswordComparison } from '@/utils/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    console.log(`Password verification attempt for email: ${email}`);
    
    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get detailed debug information about the password comparison
    const debugInfo = await debugPasswordComparison(password, user.password);
    
    return res.status(200).json({
      message: 'Password verification check completed',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      },
      passwordCheck: {
        isValidHash: debugInfo.isValidHash,
        matchesOriginal: debugInfo.matchesOriginal,
        matchesNew: debugInfo.matchesNew
      }
    });
  } catch (error) {
    console.error('Password verification error:', error);
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
}
