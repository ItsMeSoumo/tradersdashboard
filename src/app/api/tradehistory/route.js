import { NextResponse } from 'next/server';
import { connectDB } from '@/dbConfig/dbConfig';
import TradeHistory from '@/models/tradeHistory.model';
import mongoose from 'mongoose';

// GET: Fetch trade history (all or by trader ID)
export async function GET(request) {
  try {
    // Connect to the database
    await connectDB();
    
    // Get parameters from query params
    const { searchParams } = new URL(request.url);
    const traderId = searchParams.get('traderId');
    const userId = searchParams.get('userId');
    
    let query = {};
    
    // Filter by trader if traderId is provided
    if (traderId) {
      query.trader = traderId;
    }
    
    // Filter by user if userId is provided
    if (userId) {
      query.user = userId;
    }
    
    console.log('Trade history query:', query);
    
    // Fetch trade history with the specified query
    const tradeHistory = await TradeHistory.find(query)
      .sort({ date: -1 }) // Sort by date in descending order (newest first)
      .populate('trader', 'name email')
      .populate('user', 'username email');
    
    return NextResponse.json({
      success: true,
      message: "Trade history fetched successfully",
      data: tradeHistory,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching trade history:', error);
    return NextResponse.json({
      message: 'Error fetching trade history',
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST: Create a new trade record
export async function POST(request) {
  try {
    // Connect to the database
    await connectDB();
    
    // Parse the request body
    const data = await request.json();
    
    // Required fields validation
    const requiredFields = ['trader', 'user', 'tradeType', 'amount', 'currentBalance', 'day'];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        return NextResponse.json({
          success: false,
          message: `${field} is required`
        }, { status: 400 });
      }
    }
    
    console.log('Creating trade with data:', data);
    
    console.log('Creating new trade record with data:', JSON.stringify(data, null, 2));
    
    // Validate trader ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(data.trader)) {
      console.error('Invalid trader ID format:', data.trader);
      return NextResponse.json({
        success: false,
        message: 'Invalid trader ID format'
      }, { status: 400 });
    }
    
    // Create a new trade history record
    const newTradeRecord = new TradeHistory({
      trader: data.trader,
      user: data.user,
      tradeType: data.tradeType,
      amount: data.amount || data.initialMoney, // Use amount if provided, otherwise fallback to initialMoney
      profitLoss: data.profitLoss || 0,
      day: data.day,
      date: data.date || new Date()
    });
    
    console.log('TradeHistory model created:', newTradeRecord);
    
    try {
      // Save the trade record to the database
      const savedRecord = await newTradeRecord.save();
      console.log('Trade record saved successfully:', savedRecord);
    } catch (saveError) {
      console.error('Error saving trade record:', saveError);
      return NextResponse.json({
        success: false,
        message: 'Error saving trade record',
        error: saveError.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Trade record created successfully",
      data: newTradeRecord
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating trade record:', error.message);
    return NextResponse.json({
      message: 'Error creating trade record',
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
