"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [traderData, setTraderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all users
        const usersResponse = await fetch('/api/users');
        const usersData = await usersResponse.json();
        
        if (usersData.success) {
          setUsers(usersData.data);
        } else {
          setError(usersData.message || 'Failed to fetch users');
        }

        // If user is logged in and is a trader, fetch trader data
        if (session?.user?.id && session?.user?.role === 'trader') {
          const traderResponse = await fetch(`/api/traders?id=${session.user.id}`);
          const traderData = await traderResponse.json();
          
          if (traderData.success && traderData.data.length > 0) {
            const trader = traderData.data[0];
            setTraderData(trader);
            
            // If trader has assigned users
            if (trader.assignedUsers && trader.assignedUsers.length > 0) {
              setAssignedUsers(trader.assignedUsers);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error fetching data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchData();
    }
  }, [session]);

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <header className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Assigned Users Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">View and manage your assigned users</p>
          </div>
          <div className="flex items-center space-x-4">
            {session && (
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-300">Logged in as:</p>
                <p className="font-medium text-gray-800 dark:text-white">{session.user.email}</p>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-600 dark:text-gray-300">Loading assigned users...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : assignedUsers.length === 0 ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-6">
            <p>No assigned users found. Assign users to get started.</p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Your Assigned Users</h2>
            <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Initial Investment</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Current Balance</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {assignedUsers.map((user) => (
                    <tr 
                      key={user._id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => router.push(`/user/${user._id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${user.money ? user.money.toFixed(2) : '0.00'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${user.presentmoney ? user.presentmoney.toFixed(2) : '0.00'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
