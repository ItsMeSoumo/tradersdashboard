"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import { useSession } from 'next-auth/react';

export default function UserDetailPage({ params }) {
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeFormData, setTradeFormData] = useState({
    tradeType: 'buy',
    initialMoney: '',
    amount: '',
    currentBalance: '',
    profitLoss: '',
    day: new Date().toLocaleString('en-US', { weekday: 'long' })
  });
  const [updateFormData, setUpdateFormData] = useState({
    money: '',
    profit: '',
    presentmoney: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        console.log('Fetching user with ID:', resolvedParams.id);
        const response = await fetch(`/api/users/${resolvedParams.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setUser(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch user data');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (resolvedParams.id) {
      fetchUser();
    }
  }, [resolvedParams.id]);
  
  // Fetch trade history when user or session changes
  useEffect(() => {
    const fetchTradeHistory = async () => {
      if (!session?.user?.id || !user) return;
      
      try {
        // Fetch trades for this trader
        const response = await fetch(`/api/tradehistory?traderId=${session.user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch trade history');
        }
        
        const data = await response.json();  
        
        if (data.success) {
          setTradeHistory(data.data);
        } else {
          console.error('Error fetching trade history:', data.message);
        }
      } catch (err) {
        console.error('Error fetching trade history:', err);
      }
    };
    
    if (session?.user?.id && user) {
      fetchTradeHistory();
    }
  }, [session?.user?.id, user]);

  // Calculate profit/loss percentage
  const calculatePercentage = () => {
    if (!user || !user.money || user.money <= 0 || !user.presentmoney) {
      return { value: 0, isProfit: false };
    }
    
    const difference = user.presentmoney - user.money;
    const percentage = (difference / user.money) * 100;
    
    return {
      value: Math.abs(percentage).toFixed(2),
      isProfit: percentage >= 0
    };
  };
  
  // Function to show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };
  
  // Function to handle opening the update modal
  const handleOpenUpdateModal = () => {
    if (!user) return;
    
    setUpdateFormData({
      money: user.money || 0,
      profit: user.profit || 0,
      presentmoney: user.presentmoney || 0
    });
    setShowUpdateModal(true);
  };
  
  // Function to handle update form input changes
  const handleUpdateFormChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData({
      ...updateFormData,
      [name]: value === '' ? '' : parseFloat(value) || 0
    });
  };
  
  // Function to handle input focus - clears the value if it's 0
  const handleInputFocus = (e) => {
    const { name, value } = e.target;
    if (value === '0' || value === 0) {
      if (e.target.form.id === 'tradeForm') {
        setTradeFormData({
          ...tradeFormData,
          [name]: ''
        });
      } else {
        setUpdateFormData({
          ...updateFormData,
          [name]: ''
        });
      }
    }
  };
  
  // Function to handle trade form input changes
  const handleTradeFormChange = (e) => {
    const { name, value } = e.target;
    
    // Update the form data with the new value
    const updatedFormData = {
      ...tradeFormData,
      [name]: name === 'tradeType' || name === 'day' ? value : value
    };
    
    // If changing amount or currentBalance, recalculate profit/loss
    if (name === 'amount' || name === 'currentBalance') {
      // Only calculate if both values are present
      if (updatedFormData.amount && updatedFormData.currentBalance) {
        // Calculate profit/loss after updating the form data
        const amount = parseFloat(updatedFormData.amount) || 0;
        const currentBalance = parseFloat(updatedFormData.currentBalance) || 0;
        updatedFormData.profitLoss = (currentBalance - amount).toFixed(2);
      }
    }
    
    setTradeFormData(updatedFormData);
  };
  
  // Function to handle key press in form inputs
  const handleKeyPress = (e) => {
    // If Enter key is pressed, submit the form
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = document.getElementById('tradeForm');
      if (form) {
        // Trigger form submission
        const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
        form.dispatchEvent(submitEvent);
      }
    }
  };
  
  // Function to calculate profit/loss based on current balance and amount
  const calculateProfitLoss = () => {
    // Use values from form state
    const amount = parseFloat(tradeFormData.amount) || 0;
    const currentBalance = parseFloat(tradeFormData.currentBalance) || 0;
    
    // Calculate profit/loss (current balance - amount)
    const profitLoss = currentBalance - amount;
    
    console.log(`Calculating profit/loss: ${currentBalance} - ${amount} = ${profitLoss}`);
    
    return profitLoss.toFixed(2);
  };
  
  // Function to handle opening the trade modal
  const handleOpenTradeModal = () => {
    if (!user) return;
    
    const initialMoney = user.money ? user.money.toString() : '0';
    const currentBalance = user.presentmoney ? user.presentmoney.toString() : '0';
    let profitLoss = '';
    
    // Get the most recent trade amount if available, otherwise use initialMoney
    let previousAmount = initialMoney;
    if (tradeHistory.length > 0) {
      // Use the amount from the most recent trade
      previousAmount = tradeHistory[0].amount ? tradeHistory[0].amount.toString() : initialMoney;
    }
    
    // Calculate profit/loss if both amount and current balance are available
    let profitLossValue = '';
    if (previousAmount && currentBalance) {
      const amountFloat = parseFloat(previousAmount) || 0;
      const currentBalanceFloat = parseFloat(currentBalance) || 0;
      profitLossValue = (currentBalanceFloat - amountFloat).toFixed(2);
    }
    
    setTradeFormData({
      tradeType: 'buy',
      initialMoney: initialMoney,
      amount: previousAmount, // Use the previous trade amount
      currentBalance: currentBalance,
      profitLoss: profitLossValue,
      day: new Date().toLocaleString('en-US', { weekday: 'long' })
    });
    
    setShowTradeModal(true);
  };
  
  // Function to add a trade record
  const addTradeRecord = async (e) => {
    e.preventDefault();
    if (!user || !session?.user?.id) return;
    
    // Get values from form data
    const initialMoney = parseFloat(tradeFormData.initialMoney) || 0; // This is read-only now
    const currentBalance = parseFloat(tradeFormData.currentBalance) || 0;
    const amount = parseFloat(tradeFormData.amount) || 0;
    const profitLoss = (currentBalance - amount).toFixed(2); // Calculate profit/loss as currentBalance - amount
    
    // Prepare data for submission
    const dataToSubmit = {
      trader: session.user.id,
      user: user._id, // Add the user ID to the trade record
      tradeType: tradeFormData.tradeType,
      initialMoney: user.money, // Use the existing user.money value, not the form value
      currentBalance: currentBalance,
      amount: amount, // This is the actual trade amount
      profitLoss: parseFloat(profitLoss) || 0,
      day: tradeFormData.day
    };
    
    console.log('Submitting trade with data:', dataToSubmit);
    
    setTradeLoading(true);
    try {
      // First, update the user's presentmoney based on the form values
      // Note: We're not updating the money (initial investment) anymore
      const userUpdateResponse = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presentmoney: dataToSubmit.currentBalance, // Update current balance only
          traderId: session.user.id // Include trader ID for updating trader's profit
        }),
      });
      
      const userUpdateData = await userUpdateResponse.json();
      
      if (!userUpdateData.success) {
        showNotification('error', 'Failed to update user balance');
        throw new Error('Failed to update user balance');
      }
      
      // Then create the trade history record
      const response = await fetch('/api/tradehistory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add the new trade record to the trade history state
        setTradeHistory(prevHistory => [data.data, ...prevHistory]);
        
        // Update the user state with the new values
        setUser(userUpdateData.data);
        
        setShowTradeModal(false);
        showNotification('success', 'Trade record added and balances updated successfully');
      } else {
        showNotification('error', data.message || 'Failed to add trade record');
      }
    } catch (error) {
      console.error('Error adding trade record:', error);
      showNotification('error', 'An error occurred while adding the trade record');
    } finally {
      setTradeLoading(false);
    }
  };
  
  // Function to update user money and profit
  const updateUser = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    // Convert empty values to 0 before submission
    const dataToSubmit = {
      money: updateFormData.money === '' ? 0 : parseFloat(updateFormData.money) || 0,
      profit: updateFormData.profit === '' ? 0 : parseFloat(updateFormData.profit) || 0,
      presentmoney: updateFormData.presentmoney === '' ? 0 : parseFloat(updateFormData.presentmoney) || 0
    };
    
    // Add trader ID from session if available
    if (session?.user?.id) {
      dataToSubmit.traderId = session.user.id;
      console.log('Adding trader ID to request:', session.user.id);
    }
    
    setUpdateLoading(true);
    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.data);
        setShowUpdateModal(false);
        showNotification('success', 'User updated successfully');
      } else {
        showNotification('error', data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showNotification('error', 'An error occurred while updating the user');
    } finally {
      setUpdateLoading(false);
    }
  };
  


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading User</h2>
              <p className="text-gray-600">{error}</p>
              <div className="mt-6 flex justify-center">
                <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h2>
              <p className="text-gray-600">The requested user could not be found.</p>
              <div className="mt-6 flex justify-center">
                <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const percentage = calculatePercentage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <button 
            onClick={() => router.push('/?tab=users')} 
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 bg-white py-1.5 px-3 rounded-lg shadow-sm"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Users
          </button>
        </div>
        
        <div className="p-6 sm:p-8 bg-white rounded-xl shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account Information
              </h2>
              <div className="space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Username</span>
                  <span className="text-gray-800 font-medium">{user.username || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Email</span>
                  <span className="text-gray-800">{user.email || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">User ID</span>
                  <div className="flex-shrink-0 max-w-[60%] overflow-hidden">
                    <span className="text-xs font-mono bg-gray-100 p-1.5 rounded block truncate">{user._id}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Role</span>
                  <span className="capitalize bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">{user.role || 'User'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Member Since</span>
                  <span className="text-gray-800">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Financial Summary
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <p className="text-sm text-gray-500 mb-1">Initial Investment</p>
                  <div className="flex items-baseline overflow-hidden">
                    <span className="text-xl font-bold text-gray-800 tabular-nums tracking-tight">$</span>
                    <span className="text-xl font-bold text-gray-800 tabular-nums tracking-tight truncate">{user.money ? user.money.toFixed(2) : '0.00'}</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <p className="text-sm text-gray-500 mb-1">Current Balance</p>
                  <div className="flex items-baseline overflow-hidden">
                    <span className="text-xl font-bold text-gray-800 tabular-nums tracking-tight">$</span>
                    <span className="text-xl font-bold text-gray-800 tabular-nums tracking-tight truncate">{user.presentmoney ? user.presentmoney.toFixed(2) : '0.00'}</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <p className="text-sm text-gray-500 mb-1">Profit/Loss</p>
                  <div className="block">
                    <div className={`text-xl font-bold tabular-nums tracking-tight ${percentage.isProfit ? 'text-green-500' : 'text-red-500'}`}>
                      {percentage.isProfit ? '+$' : '-$'}{Math.abs(user.presentmoney - user.money).toFixed(2)}
                    </div>
                    <div className={`text-sm mt-1 ${percentage.isProfit ? 'text-green-500' : 'text-red-500'} whitespace-nowrap`}>({percentage.value}%)</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Trade History Section */}
            <div className="mt-8">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19l3 3m0 0l3-3m-3 3V4m0 0l-3 3m3-3l3 3" />
                  </svg>
                  Trade History
                </h2>
                {tradeHistory.length > 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 mb-4">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Profit/Loss</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Day</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tradeHistory.map((trade, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                trade.tradeType === 'buy'
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {trade.tradeType.charAt(0).toUpperCase() + trade.tradeType.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-baseline">
                                <span className="text-sm font-bold tabular-nums tracking-tight text-gray-800">
                                  ${trade.amount ? trade.amount.toFixed(2) : '0.00'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-medium ${
                                trade.profitLoss > 0 ? 'text-green-600' : trade.profitLoss < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {trade.profitLoss > 0 ? '+' : ''}{trade.profitLoss ? trade.profitLoss.toFixed(2) : '0.00'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">
                                {trade.day}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {trade.date ? new Date(trade.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                    <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No trade history found</h3>
                    <p className="text-gray-500 mb-6">Start adding trades to see your history here.</p>
                    <button 
                      onClick={handleOpenTradeModal}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Your First Trade
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {user.transactions && user.transactions.length > 0 && (
              <div className="mt-8">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Recent Transactions
                </h2>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 mb-4">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {user.transactions.slice(0, 5).map((transaction, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                transaction.type === 'deposit' || transaction.type === 'profit' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-baseline">
                                <span className="text-sm font-bold tabular-nums tracking-tight text-gray-800">
                                  ${transaction.amount ? transaction.amount.toFixed(2) : '0.00'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">
                                {transaction.description || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {transaction.date ? new Date(transaction.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
                  <div className="flex justify-end mt-4">
                    <Link href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                      <span>View All Transactions</span>
                      <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                </div>
              </div>
            </div>
            )}
            
            <div className="mt-8 flex justify-between">
              <div className="flex space-x-4">
                <button 
                  onClick={() => window.history.back()}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium h-10 px-6 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={handleOpenTradeModal}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium h-10 px-6 rounded-lg shadow-md transition-colors duration-200 flex items-center mr-2"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Trade
                </button>
                <button 
                  onClick={handleOpenUpdateModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-10 px-6 rounded-lg shadow-md transition-colors duration-200 flex items-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Update
                </button>
              </div>
            </div>
            
            {/* Update Balance Modal */}
            {showUpdateModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md border border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Update User Balance</h2>
                    <button 
                      onClick={() => setShowUpdateModal(false)}
                      className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="mb-6 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="text-blue-800">Updating balance for: <span className="font-semibold">{user.username}</span></p>
                  </div>
                  <form onSubmit={updateUser}>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Money Balance ($)</label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            name="money"
                            step="0.01"
                            value={updateFormData.money}
                            onChange={handleUpdateFormChange}
                            onFocus={handleInputFocus}
                            className="w-full pl-7 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 text-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Present Money ($)</label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            name="presentmoney"
                            step="0.01"
                            value={updateFormData.presentmoney}
                            onChange={handleUpdateFormChange}
                            onFocus={handleInputFocus}
                            className="w-full pl-7 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 text-lg"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setShowUpdateModal(false)}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateLoading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {updateLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </>
                        ) : 'Update Balance'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            

            
            {/* Trade Modal */}
            {showTradeModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md border border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Add Trade Record</h2>
                    <button 
                      onClick={() => setShowTradeModal(false)}
                      className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="mb-6 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="text-blue-800">Adding trade for: <span className="font-semibold">{user.username}</span></p>
                  </div>
                  <form id="tradeForm" onSubmit={addTradeRecord}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Trade Type</label>
                        <select
                          name="tradeType"
                          value={tradeFormData.tradeType}
                          onChange={handleTradeFormChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                        >
                          <option value="buy">Buy</option>
                          <option value="sell">Sell</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Investment ($)</label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            name="initialMoney"
                            step="0.01"
                            value={tradeFormData.initialMoney}
                            readOnly
                            className="w-full pl-7 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-700 cursor-not-allowed"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Total investment (view only)</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Trading Amount ($)</label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            name="amount"
                            step="0.01"
                            value={tradeFormData.amount}
                            onChange={handleTradeFormChange}
                            onFocus={handleInputFocus}
                            onKeyPress={handleKeyPress}
                            className="w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Amount for this specific trade</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Current Balance ($)</label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            name="currentBalance"
                            step="0.01"
                            value={tradeFormData.currentBalance}
                            onChange={handleTradeFormChange}
                            onFocus={handleInputFocus}
                            onBlur={calculateProfitLoss}
                            onKeyPress={handleKeyPress}
                            className="w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Current account balance</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Profit/Loss ($)</label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            name="profitLoss"
                            step="0.01"
                            value={tradeFormData.profitLoss}
                            readOnly
                            className={`w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${parseFloat(tradeFormData.profitLoss) > 0 ? 'text-green-600' : parseFloat(tradeFormData.profitLoss) < 0 ? 'text-red-600' : 'text-gray-700'}`}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Current Balance - Trading Amount</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Day</label>
                        <select
                          name="day"
                          value={tradeFormData.day}
                          onChange={handleTradeFormChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                        >
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-8 flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setShowTradeModal(false)}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={tradeLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {tradeLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding...
                          </>
                        ) : 'Add Trade'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {/* Notification */}
            {notification.show && (
              <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                {notification.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
