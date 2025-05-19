import { connectDB } from '@/dbConfig/dbConfig.js';
import User from '@/models/user.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await connectDB();
    
    const requestData = await request.json();
    const { email, password } = requestData;
    
    // Validation
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }
    
    console.log(`Login attempt for email: ${email}`);
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    
    console.log(`User found with email: ${email}`);
    console.log(`Stored password length: ${user.password.length}`);
    
    // Compare passwords with direct string comparison
    console.log(`Comparing provided password with stored password`);
    const isMatch = password === user.password;
    
    console.log(`Password match result: ${isMatch}`);
    
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    
    // If we reach here, password matched
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Something went wrong', error: error.message }, { status: 500 });
  }
}
