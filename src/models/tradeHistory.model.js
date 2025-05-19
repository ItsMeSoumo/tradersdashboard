import mongoose from "mongoose";

const tradeHistorySchema = new mongoose.Schema({
  trader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trader',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tradeType: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  profitLoss: {
    type: Number,
    default: 0
  },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Create and export the TradeHistory model
const TradeHistory = mongoose.models.TradeHistory || mongoose.model('TradeHistory', tradeHistorySchema);

export default TradeHistory;
