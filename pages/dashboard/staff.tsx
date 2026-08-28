'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Button from '@/components/Common/Button';
import { BiPlus, BiTrash, BiX, BiUser } from 'react-icons/bi';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface StaffMember {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  role: string;
  is_active: boolean;
}

export default function StaffManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const rolesResponse = await api.get('/user-roles/?role=bank_admin');
      const adminRoles = rolesResponse.data.results || rolesResponse.data;
      if (adminRoles.length > 0) {
        setAuthorized(true);
        fetchStaff();
      } else {
        toast.error('Unauthorized: Only bank admins can manage staff');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking authorization:', error);
      router.push('/dashboard');
    }
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user-roles/?role=bank_staff');
      setStaff(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Get current user's bank from auth
      const meResponse = await api.get('/auth/me/');

      // Create user
      const userResponse = await api.post('/users/register/', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      // Create bank staff role (need to get bank ID from current user's role)
      const rolesResponse = await api.get('/user-roles/?role=bank_admin');
      const adminRole = rolesResponse.data.results?.[0] || rolesResponse.data[0];

      await api.post('/user-roles/', {
        user_id: userResponse.data.id,
        role: 'bank_staff',
        bank_id: adminRole.bank?.id,
        is_active: true,
      });

      toast.success('Staff member added successfully!');
      setFormData({ username: '', email: '', password: '' });
      setShowAddForm(false);
      fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add staff member');
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      // TODO: Implement delete endpoint for user roles
      toast.success('Staff member removal feature coming soon');
    } catch (error) {
      toast.error('Failed to remove staff member');
    }
  };

  if (!authorized) {
    return (
      <Layout>
        <div className="min-h-screen bg-white p-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-red-600 font-semibold">Unauthorized</p>
            <p className="text-gray-600 mt-2">Only bank admins can access this section</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-white p-8">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
              <p className="text-sm text-gray-500 mt-2">Add and manage bank staff members</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="mt-4 sm:mt-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <BiPlus size={18} /> Add Staff Member
            </button>
          </div>
        </div>

        {/* Add Staff Form */}
        {showAddForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Add New Staff Member</h2>
              <button onClick={() => setShowAddForm(false)}>
                <BiX size={24} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Staff username"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="staff@bank.com"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Secure password"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Add Staff Member
                </Button>
                <Button
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Staff List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Current Staff</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading staff members...</div>
          ) : staff.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map((member) => (
                <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <BiUser size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">@{member.user.username}</p>
                        <p className="text-sm text-gray-600">{member.user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteStaff(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <BiTrash size={18} />
                    </button>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Status: {member.is_active ? (
                        <span className="text-green-600 font-medium">Active</span>
                      ) : (
                        <span className="text-red-600 font-medium">Inactive</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
              <BiUser size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No staff members added yet</p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white mx-auto flex items-center gap-2"
              >
                <BiPlus size={18} /> Add First Staff Member
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
