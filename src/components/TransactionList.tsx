import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../AuthContext';
import { Transaction, Book, Student } from '../types';
import { Repeat, Plus, X, Loader2, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function TransactionList() {
  const { token, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const isAdmin = user?.role === 'admin';

  const [formData, setFormData] = useState({
    bookId: '',
    studentId: '',
    dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd') // 14 days default
  });

  const fetchData = async () => {
    const [tRes, bRes, sRes] = await Promise.all([
      fetch('/api/transactions', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/api/books', { headers: { 'Authorization': `Bearer ${token}` } }),
      isAdmin ? fetch('/api/students', { headers: { 'Authorization': `Bearer ${token}` } }) : Promise.resolve({ json: () => [] } as unknown as Response)
    ]);
    
    setTransactions(await tRes.json());
    setBooks(await (bRes as Response).json());
    if (isAdmin) setStudents(await (sRes as Response).json());
  };

  useEffect(() => {
    fetchData();
  }, [token, isAdmin]);

  const handleIssue = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/transactions/issue', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...formData,
        bookId: parseInt(formData.bookId),
        studentId: parseInt(formData.studentId)
      })
    });

    if (res.ok) {
      setShowModal(false);
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to issue book');
    }
    setLoading(false);
  };

  const handleReturn = async (id: number) => {
    if (!confirm('Mark this book as returned?')) return;
    const res = await fetch(`/api/transactions/return/${id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const { fine } = await res.json();
      if (fine > 0) alert(`Book returned. Fine incurred: $${fine}`);
      else alert('Book returned successfully.');
      fetchData();
    } else {
      alert('Failed to return book');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-gray-500 font-mono text-sm uppercase tracking-widest">
          <Repeat size={16} /> Activity History
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#FF4E00] text-white rounded-xl hover:bg-[#e64600] transition-colors"
          >
            <Plus size={18} /> Issue New Book
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-500">Transaction Details</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-500">Dates</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-500 text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-500 text-right">Fine</th>
                {isAdmin && <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-500 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-serif italic text-gray-900">{t.bookTitle}</p>
                      <p className="text-xs text-gray-500">{t.studentName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-gray-400 uppercase w-12">Issue:</span>
                        <span className="text-gray-600">{format(parseISO(t.issueDate), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-gray-400 uppercase w-12 text-blue-500">Due:</span>
                        <span className="text-gray-600 font-medium">{format(parseISO(t.dueDate), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {t.returnDate ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full">
                        <CheckCircle2 size={12} /> Returned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase rounded-full">
                        In Use
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-mono text-sm ${t.fine > 0 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                      ${t.fine.toFixed(2)}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      {!t.returnDate && (
                        <button 
                          onClick={() => handleReturn(t.id)}
                          className="text-xs font-mono uppercase bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all"
                        >
                          Mark Return
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="p-12 text-center text-gray-400 font-serif italic">
              No transactions recorded yet.
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-serif italic mb-6">Issue Book</h2>
            
            <form onSubmit={handleIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">Select Book</label>
                <select 
                  required
                  value={formData.bookId}
                  onChange={(e) => setFormData({...formData, bookId: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4E00]"
                >
                  <option value="">-- Choose a book --</option>
                  {books.filter(b => b.availableCopies > 0).map(b => (
                    <option key={b.id} value={b.id}>{b.title} ({b.availableCopies} avail.)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">Select Student</label>
                <select 
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4E00]"
                >
                  <option value="">-- Choose a student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.studentId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">Due Date</label>
                <input 
                  required
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4E00]"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-4 bg-[#FF4E00] text-white rounded-xl font-medium hover:bg-[#e64600] flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Confirm Issue'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
