import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { DashboardStats } from '../types';
import { Book, Users, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setStats(data));
    }
  }, [token, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-gray-100">
        <Library className="text-[#FF4E00] w-12 h-12 mb-4" />
        <h2 className="text-xl font-serif text-gray-900 mb-2">Welcome to your Library Portal</h2>
        <p className="text-gray-500 text-center max-w-sm">Use the side menu to browse available books or check your current issued books and transactions.</p>
      </div>
    );
  }

  if (!stats) return <div className="animate-pulse text-gray-400 font-mono">LOADING_METRICS...</div>;

  const statCards = [
    { label: 'Total Collection', value: stats.totalBooks, icon: Book, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Students', value: stats.totalStudents, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Issued Now', value: stats.issuedBooks, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Overdue Returns', value: stats.overdueBooks, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-1">{stat.label}</p>
              <h3 className="text-3xl font-serif text-gray-900">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-serif italic text-gray-900 mb-6">Quick Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Inventory Health</span>
              <span className="font-mono text-green-600">GOOD</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-green-500 h-full transition-all" 
                style={{ width: `${(stats.availableBooks / stats.totalBooks) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 italic">
              {stats.availableBooks} out of {stats.totalBooks} books currently available on shelves.
            </p>
          </div>
        </div>

        <div className="bg-[#141414] text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-serif italic mb-2">Automated Notifications</h3>
            <p className="text-gray-400 text-sm">System is currently tracking return dates and calculating fines in real-time.</p>
          </div>
          <div className="flex gap-4 mt-6">
            <div className="flex-1 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] uppercase font-mono tracking-widest text-gray-500 mb-2">Daily Fine</p>
              <p className="text-xl font-serif">$5.00</p>
            </div>
            <div className="flex-1 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] uppercase font-mono tracking-widest text-gray-500 mb-2">Grace Period</p>
              <p className="text-xl font-serif">0 Days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Library } from 'lucide-react';
