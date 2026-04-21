/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import BookList from './components/BookList';
import TransactionList from './components/TransactionList';
import StudentList from './components/StudentList';
import { Layout, Library } from 'lucide-react';

function MainApp() {
  const { isAuthenticated, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-[#F5F5F0]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-serif italic text-gray-900">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="text-sm text-gray-500">Welcome back, {user?.fullName}</p>
          </div>
          <button 
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
          >
            Sign Out
          </button>
        </header>

        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'books' && <BookList />}
          {activeTab === 'transactions' && <TransactionList />}
          {activeTab === 'students' && <StudentList />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

