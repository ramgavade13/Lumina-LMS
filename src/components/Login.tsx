import { useState, FormEvent } from 'react';
import { useAuth } from '../AuthContext';
import { Library, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      if (response.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#151619] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#1a1b1e] border border-gray-800 rounded-2xl p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#FF4E00] rounded-xl flex items-center justify-center mb-4">
            <Library className="text-white" />
          </div>
          <h2 className="text-2xl font-serif text-white">Lumina Library</h2>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm bg-red-900/30 border border-red-800 text-red-200 rounded-lg">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Username</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#FF4E00] transition-colors"
              placeholder="admin or student"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#FF4E00] transition-colors"
              placeholder="admin123 or student123"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#FF4E00] text-white py-3 rounded-lg font-medium hover:bg-[#e64600] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Access Terminal'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
          <p className="text-xs text-gray-600 font-mono">
            SECURE ACCESS / AES-256 ENCRYPTED
          </p>
        </div>
      </motion.div>
    </div>
  );
}
