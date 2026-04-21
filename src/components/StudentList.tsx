import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Student } from '../types';
import { Users, Mail, IdCard } from 'lucide-react';

export default function StudentList() {
  const { token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetch('/api/students', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setStudents(data));
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-500">Student Identity</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-500">System ID</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-500">Contact</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-500 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F5F5F0] border border-gray-200 flex items-center justify-center text-gray-400">
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="font-serif italic text-gray-900">{student.fullName}</p>
                        <p className="text-xs text-gray-400 capitalize">Registered User</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-600">
                      <IdCard size={14} className="text-gray-400" />
                      {student.studentId}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Mail size={14} className="text-gray-400" />
                      {student.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-[10px] items-center">
                    <span className="px-2 py-1 bg-green-50 text-green-700 font-bold rounded-lg border border-green-100 uppercase tracking-tighter">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && (
            <div className="p-12 text-center text-gray-400 font-serif italic">
              No student records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
