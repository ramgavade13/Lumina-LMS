import { LayoutDashboard, BookOpen, Repeat, Users, Library } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'books', label: 'Book Collection', icon: BookOpen },
    { id: 'transactions', label: 'Transactions', icon: Repeat },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'students', label: 'Student Records', icon: Users });
  }

  return (
    <div className="w-64 bg-[#141414] text-white flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-gray-800">
        <div className="w-8 h-8 bg-[#FF4E00] rounded-lg flex items-center justify-center">
          <Library size={18} />
        </div>
        <span className="font-serif italic text-lg tracking-tight">Lumina</span>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
              activeTab === item.id 
                ? 'bg-[#FF4E00] text-white' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-sm">
            {user?.fullName.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-500 uppercase font-mono">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
