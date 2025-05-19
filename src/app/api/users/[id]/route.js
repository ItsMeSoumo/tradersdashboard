import { NextResponse } from 'next/server';
import connectDB from '@/dbConfig/dbConfig';
import User from '@/models/user';
import Trader from '@/models/trader.model';

// GET: Fetch a single user by ID
export async function GET(request, { params }) {
  try {
    // Connect to the database
    await connectDB();
    
    // Get user ID from the URL params
    // In Next.js App Router, params might be a promise
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.id;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User ID is required"
      }, { status: 400 });
    }
    
    // Find the user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found"
      }, { status: 404 });
    }
    
    // Return the user data
    return NextResponse.json({
      success: true,
      data: user
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({
      success: false,
      message: "Error fetching user",
      error: error.message
    }, { status: 500 });
  }
}

// PUT: Update user money and profit directly
export async function PUT(request, { params }) {
  try {
    // Connect to the database
    await connectDB();
    
    // Get user ID from the URL params
    // In Next.js App Router, params might be a promise
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.id;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User ID is required"
      }, { status: 400 });
    }
    
    // Parse the request body
    const data = await request.json();
    const { money, profit, presentmoney, traderId } = data;
    
    console.log('Request data:', data);  // Log the request data for debugging
    
    // Validate the data
    if (money === undefined && presentmoney === undefined) {
      return NextResponse.json({
        success: false,
        message: "At least one of money or presentmoney must be provided"
      }, { status: 400 });
    }
    
    // Note: profit is now automatically calculated, so we don't need it in the request
    
    // Create update object
    const updateData = {};
    
    // Find the current user to get existing values
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: "User not found"
      }, { status: 404 });
    }
    
    // Get current values or use 0 if undefined
    let updatedMoney = currentUser.money || 0;
    let updatedPresentMoney = currentUser.presentmoney || 0;
    
    // Update money if provided
    if (money !== undefined) {
      updatedMoney = parseFloat(money);
      updateData.money = updatedMoney;
    }
    
    // Update presentmoney if provided
    if (presentmoney !== undefined) {
      updatedPresentMoney = parseFloat(presentmoney);
      updateData.presentmoney = updatedPresentMoney;
    }
    
    // Always calculate profit as presentmoney - money
    const profitDifference = updatedPresentMoney - updatedMoney;
    updateData.profit = profitDifference;
    
    console.log(`Calculating profit: ${updatedPresentMoney} - ${updatedMoney} = ${updateData.profit}`);
    
    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    // Update the profitGenerated field for the trader specified in the request (if provided)
    try {
      // Only update if both money and presentmoney have been provided (indicating an update)
      if (money !== undefined && presentmoney !== undefined && traderId) {
        // Find the trader by ID
        const trader = await Trader.findById(traderId);
        
        if (trader) {
          // Set the trader's profitGenerated field to the exact profit value
          const updatedTrader = await Trader.findByIdAndUpdate(
            traderId,
            { $set: { profitGenerated: profitDifference } },
            { new: true }
          );
          
          console.log(`Updated trader ${trader._id} profitGenerated with profit difference: ${profitDifference}`);
          console.log('New profitGenerated value:', updatedTrader.profitGenerated);
        } else {
          console.log(`No trader found with ID ${traderId}`);
        }
      }
    } catch (traderError) {
      console.error('Error updating trader profitGenerated:', traderError);
      // Continue execution even if trader update fails
    }
    
    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: "User not found"
      }, { status: 404 });
    }
    
    // Return the updated user data
    return NextResponse.json({
      success: true,
      message: "User balance updated successfully",
      data: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        money: updatedUser.money || 0,
        profit: updatedUser.profit || 0, // This is now always calculated as presentmoney - money
        presentmoney: updatedUser.presentmoney || 0,
        transactions: updatedUser.transactions || []
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error updating user balance:", error);
    return NextResponse.json({
      success: false,
      message: "Error updating user balance",
      error: error.message
    }, { status: 500 });
  }
}

// POST: Add a transaction to user
export async function POST(request, { params }) {
  try {
    // Connect to the database
    await connectDB();
    
    // Get user ID from the URL params
    // In Next.js App Router, params might be a promise
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.id;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User ID is required"
      }, { status: 400 });
    }
    
    // Parse the request body
    const data = await request.json();
    const { type, amount, description } = data;
    
    // Validate the data
    if (!type || !amount) {
      return NextResponse.json({
        success: false,
        message: "Transaction type and amount are required"
      }, { status: 400 });
    }
    
    // Get current user data
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found"
      }, { status: 404 });
    }
    
    // Create the new transaction
    const parsedAmount = parseFloat(amount);
    const newTransaction = {
      type,
      amount: parsedAmount,
      description: description || '',
      date: new Date()
    };
    
    // Initialize values if they don't exist
    const currentMoney = user.money || 0;
    const currentProfit = user.profit || 0;
    
    // Update money and profit based on transaction type
    let updatedMoney = currentMoney;
    let updatedProfit = currentProfit;
    
    if (type === 'deposit') {
      updatedMoney = currentMoney + parsedAmount;
    } else if (type === 'withdrawal') {
      updatedMoney = currentMoney - parsedAmount;
    } else if (type === 'profit') {
      updatedProfit = currentProfit + parsedAmount;
      updatedMoney = currentMoney + parsedAmount;
    } else if (type === 'loss') {
      updatedProfit = currentProfit - parsedAmount;
      updatedMoney = currentMoney - parsedAmount;
    }
    
    // Initialize transactions array if it doesn't exist
    const transactions = user.transactions || [];
    
    // Update the user with new transaction and balances
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          money: updatedMoney,
          profit: updatedProfit
        },
        $push: { 
          transactions: { 
            $each: [newTransaction],
            $position: 0
          }
        }
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: "Failed to add transaction"
      }, { status: 500 });
    }
    
    // Return the updated user data
    return NextResponse.json({
      success: true,
      message: "Transaction added successfully",
      data: updatedUser
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error adding transaction:", error);
    return NextResponse.json({
      success: false,
      message: "Error adding transaction",
      error: error.message
    }, { status: 500 });
  }
}
