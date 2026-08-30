'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Button from '@/components/Common/Button';
import { BiPlus, BiTrash, BiX, BiUser, BiEdit, BiLock, BiUnlock } from 'react-icons/bi';
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
  access_restricted?: boolean;
  allowed_days?: string; // e.g., "Mon,Tue,Wed,Thu,Fri"
  access_start_time?: string; // e.g., "09:00"
  access_end_time?: string; // e.g., "17:00"
}

export default function StaffManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [bankInactive, setBankInactive] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [bankName, setBankName] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [accessRestrictionData, setAccessRestrictionData] = useState({
    access_restricted: false,
    allowed_days: 'Mon,Tue,Wed,Thu,Fri',
    access_start_time: '09:00',
    access_end_time: '17:00',
  });

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      // Get current user
      const meResponse = await api.get('/auth/me/');
      const currentUser = meResponse.data;
      setCurrentUserId(currentUser.id);

      // Check if THIS user is a bank admin
      const rolesResponse = await api.get(`/user-roles/?user=${currentUser.id}&role=bank_admin`);
      const adminRoles = rolesResponse.data.results || rolesResponse.data;

      const isCurrentUserAdmin = adminRoles.some((role: any) => role.user?.id === currentUser.id);

      if (isCurrentUserAdmin) {
        // Check if the bank is active
        const userRole = adminRoles.find((role: any) => role.user?.id === currentUser.id);
        if (userRole && userRole.bank) {
          const bankResponse = await api.get(`/banks/${userRole.bank.id}/`);
          setBankName(bankResponse.data.name);

          if (bankResponse.data.is_active === false) {
            setBankInactive(true);
            setLoading(false);
            return;
          }
        }

        setAuthorized(true);
        fetchStaff();
      } else {
        toast.error('Unauthorized: Only bank admins can manage staff');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking authorization:', error);
      toast.error('Authorization check failed');
      router.push('/dashboard');
    }
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user-roles/?role=bank_staff');
      let staffList = response.data.results || response.data;
      // Filter out the current logged-in user - admins should not see themselves
      staffList = staffList.filter((member: StaffMember) => member.user.id !== currentUserId);
      setStaff(staffList);
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

  const handleToggleStaffActive = async (staffId: number, currentStatus: boolean) => {
    try {
      await api.patch(`/user-roles/${staffId}/`, {
        is_active: !currentStatus,
      });
      toast.success(currentStatus ? 'Teller deactivated' : 'Teller activated');
      fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update teller status');
    }
  };

  const handleOpenAccessForm = (staffMember: StaffMember) => {
    setSelectedStaffId(staffMember.id);
    setAccessRestrictionData({
      access_restricted: staffMember.access_restricted || false,
      allowed_days: staffMember.allowed_days || 'Mon,Tue,Wed,Thu,Fri',
      access_start_time: staffMember.access_start_time || '09:00',
      access_end_time: staffMember.access_end_time || '17:00',
    });
    setShowAccessForm(true);
  };

  const handleSaveAccessRestrictions = async () => {
    if (!selectedStaffId) return;
    try {
      await api.patch(`/user-roles/${selectedStaffId}/`, accessRestrictionData);
      toast.success('Access restrictions updated successfully');
      setShowAccessForm(false);
      setSelectedStaffId(null);
      fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update access restrictions');
    }
  };

  if (bankInactive) {
    return (
      <Layout>
        <div className="min-h-screen bg-white p-8 flex items-center justify-center">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <span className="text-3xl">🔒</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-2">
              {bankName ? `${bankName} has been` : 'Your bank has been'} marked as <span className="font-semibold">inactive</span>.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Bank administrators cannot access the portal while the bank is inactive. Please contact GIA for assistance.
            </p>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ Status: <span className="font-bold">INACTIVE</span>
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-black hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

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

        {/* Access Restrictions Form */}
        {showAccessForm && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Set Access Restrictions</h2>
              <button onClick={() => setShowAccessForm(false)}>
                <BiX size={24} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    checked={accessRestrictionData.access_restricted}
                    onChange={(e) => setAccessRestrictionData({ ...accessRestrictionData, access_restricted: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-900">Enable time-based access restrictions</span>
                </label>
              </div>

              {accessRestrictionData.access_restricted && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Days (comma-separated)</label>
                    <input
                      type="text"
                      value={accessRestrictionData.allowed_days}
                      onChange={(e) => setAccessRestrictionData({ ...accessRestrictionData, allowed_days: e.target.value })}
                      placeholder="Mon,Tue,Wed,Thu,Fri"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Example: Mon,Tue,Wed,Thu,Fri</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Access Start Time</label>
                      <input
                        type="time"
                        value={accessRestrictionData.access_start_time}
                        onChange={(e) => setAccessRestrictionData({ ...accessRestrictionData, access_start_time: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Access End Time</label>
                      <input
                        type="time"
                        value={accessRestrictionData.access_end_time}
                        onChange={(e) => setAccessRestrictionData({ ...accessRestrictionData, access_end_time: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveAccessRestrictions}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition"
                >
                  Save Restrictions
                </button>
                <button
                  onClick={() => setShowAccessForm(false)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-900 text-sm font-medium rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
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
                  </div>
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <p className="text-xs text-gray-500">
                      Status: {member.is_active ? (
                        <span className="text-green-600 font-medium">Active</span>
                      ) : (
                        <span className="text-red-600 font-medium">Inactive</span>
                      )}
                    </p>
                    {member.access_restricted && (
                      <p className="text-xs text-amber-600">
                        ⏰ Access Restricted: {member.allowed_days} {member.access_start_time}-{member.access_end_time}
                      </p>
                    )}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleToggleStaffActive(member.id, member.is_active)}
                        className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition flex items-center justify-center gap-1 ${
                          member.is_active
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {member.is_active ? <BiLock size={14} /> : <BiUnlock size={14} />}
                        {member.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleOpenAccessForm(member)}
                        className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium transition flex items-center justify-center gap-1"
                      >
                        <BiEdit size={14} /> Access Times
                      </button>
                    </div>
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
