import { NextResponse } from 'next/server';
import connectDB from '@/dbConfig/dbConfig';
import User from '@/models/user';

// GET: Fetch all users
export async function GET() {
  try {
    // Connect to the database before performing any operations
    await connectDB();
    
    // Fetch all users
    const users = await User.find({}).select('-password');
    
    return NextResponse.json({
      success: true,
      message: "All users fetched",
      data: users,
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
    const requiredFields = ['name', 'email'];
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
      clients: data.clients || [],
      role: 'trader',
      isVerified: true
    });
    
    // Save the trader to the database
    await newTrader.save();
    
    // Return success response
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

// PATCH: Update trader data
export async function PATCH(request) {
  try {
    // Connect to the database
    await connectDB();
    
    // Get trader ID from the URL
    const { searchParams } = new URL(request.url);
    const traderId = searchParams.get('id');
    
    if (!traderId) {
      return NextResponse.json({
        success: false,
        message: "Trader ID is required"
      }, { status: 400 });
    }
    
    // Parse the request body
    const data = await request.json();
    
    // Create update object
    const updateData = {};
    
    // Update fields if provided
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.totalTrades !== undefined) updateData.totalTrades = data.totalTrades;
    if (data.profitGenerated !== undefined) updateData.profitGenerated = data.profitGenerated;
    if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
    if (data.clients !== undefined) updateData.clients = data.clients;
    
    // If no valid fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        message: "No valid fields to update"
      }, { status: 400 });
    }
    
    // Update trader in database
    const updatedTrader = await Trader.findByIdAndUpdate(
      traderId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedTrader) {
      return NextResponse.json({
        success: false,
        message: "Trader not found"
      }, { status: 404 });
    }
    
    // Return updated trader data
    return NextResponse.json({
      success: true,
      message: "Trader updated successfully",
      data: updatedTrader
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating trader:', error.message);
    return NextResponse.json({
      message: 'Error updating trader',
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE: Delete a trader
export async function DELETE(request) {
  try {
    // Connect to the database
    await connectDB();
    
    // Get trader ID from the URL
    const url = new URL(request.url);
    const traderId = url.searchParams.get('id');
    
    if (!traderId) {
      return NextResponse.json({
        success: false,
        message: "Trader ID is required"
      }, { status: 400 });
    }
    
    // Find and delete the trader
    const trader = await Trader.findByIdAndDelete(traderId);
    
    // Check if trader was found and deleted
    if (!trader) {
      return NextResponse.json({
        success: false,
        message: "Trader not found"
      }, { status: 404 });
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: "Trader deleted successfully"
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting trader:', error.message);
    return NextResponse.json({
      message: 'Error deleting trader',
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
