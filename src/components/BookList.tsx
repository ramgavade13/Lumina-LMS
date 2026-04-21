import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../AuthContext';
import { Book } from '../types';
import { Search, Plus, Trash2, Edit3, X, Loader2 } from 'lucide-react';

export default function BookList() {
  const { token, user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);
  
  const isAdmin = user?.role === 'admin';

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    totalCopies: 1
  });

  const fetchBooks = async () => {
    const res = await fetch(`/api/books?search=${search}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setBooks(data);
  };

  useEffect(() => {
    fetchBooks();
  }, [search, token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const method = editingBook ? 'PUT' : 'POST';
    const url = editingBook ? `/api/books/${editingBook.id}` : '/api/books';
    
    const res = await fetch(url, {
      method,
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setShowModal(false);
      setEditingBook(null);
      setFormData({ title: '', author: '', isbn: '', category: '', totalCopies: 1 });
      fetchBooks();
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    const res = await fetch(`/api/books/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) fetchBooks();
    else alert('Failed to delete book');
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      totalCopies: book.totalCopies
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search books by title, author, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4E00] focus:border-transparent transition-all"
          />
        </div>
        {isAdmin && (
          <button 
            onClick={() => { setEditingBook(null); setFormData({ title: '', author: '', isbn: '', category: '', totalCopies: 1 }); setShowModal(true); }}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#141414] text-white rounded-xl hover:bg-black transition-colors"
          >
            <Plus size={18} /> Add New Book
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-500">Book Details</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-500">ISBN</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-500">Category</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-500 text-center">Available</th>
                {isAdmin && <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-500 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {books.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-serif italic text-gray-900">{book.title}</p>
                      <p className="text-xs text-gray-500">by {book.author}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">{book.isbn}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-mono rounded uppercase">
                      {book.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-mono text-sm ${book.availableCopies > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {book.availableCopies} / {book.totalCopies}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(book)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDelete(book.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {books.length === 0 && (
            <div className="p-12 text-center text-gray-400 font-serif italic">
              No books found matching your criteria.
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
            <h2 className="text-2xl font-serif italic mb-6">{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">Title</label>
                <input 
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4E00]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">Author</label>
                  <input 
                    required
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({...formData, author: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4E00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">Category</label>
                  <input 
                    required
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4E00]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">ISBN</label>
                  <input 
                    required
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4E00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">Total Copies</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    value={formData.totalCopies}
                    onChange={(e) => setFormData({...formData, totalCopies: parseInt(e.target.value)})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4E00]"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-4 bg-[#FF4E00] text-white rounded-xl font-medium hover:bg-[#e64600] flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : editingBook ? 'Save Changes' : 'Add to Collection'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
