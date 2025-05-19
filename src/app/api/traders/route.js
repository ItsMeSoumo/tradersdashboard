import { NextResponse } from 'next/server';
import connectDB from '@/dbConfig/dbConfig';
import Trader from '@/models/trader.model';

// GET: Fetch all traders with populated assignedUsers
export async function GET(request) {
  try {
    // Connect to the database before performing any operations
    await connectDB();
    
    // Get trader ID from query params if provided
    const { searchParams } = new URL(request.url);
    const traderId = searchParams.get('id');
    
    let query = {};
    if (traderId) {
      query = { _id: traderId };
    }
    
    // Fetch traders with populated assignedUsers
    const traders = await Trader.find(query)
      .select('-password')
      .populate('assignedUsers', 'username email role isVerified money presentmoney');
    
    return NextResponse.json({
      success: true,
      message: traderId ? "Trader fetched successfully" : "All traders fetched",
      data: traders,
    }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      message: 'Error in fetching traders',
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST: Create a new trader
export async function POST(request) {
  try {
    // Connect to the database
    await connectDB();
    
    // Parse the request body
    const data = await request.json();
    
    // Required fields validation
    const requiredFields = ['name', 'email', 'password'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({
          success: false,
          message: `${field} is required`
        }, { status: 400 });
      }
    }
    
    // Check if trader with email already exists
    const existingTrader = await Trader.findOne({ email: data.email });
    if (existingTrader) {
      return NextResponse.json({
        success: false,
        message: "Trader with this email already exists"
      }, { status: 400 });
    }
    
    // Create a new trader document
    const newTrader = new Trader({
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      totalTrades: data.totalTrades || 0,
      profitGenerated: data.profitGenerated || 0,
      assignedUsers: data.assignedUsers || [],
      role: 'trader',
      isVerified: true,
      password: data.password
    });
    
    // Save the trader to the database
    await newTrader.save();
    
    return NextResponse.json({
      success: true,
      message: "Trader created successfully",
      data: newTrader
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating trader:', error.message);
    return NextResponse.json({
      message: 'Error creating trader',
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
