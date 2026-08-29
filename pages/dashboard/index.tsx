'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Loading from '@/components/Common/Loading';
import Button from '@/components/Common/Button';
import { BankPaymentSubmission, BankUser } from '@/types';
import api from '@/lib/api';
import { getBankUser } from '@/lib/auth';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { BiUpload, BiPlus, BiCheckCircle, BiHourglass, BiListUl, BiDollar } from 'react-icons/bi';

interface Bank {
  id: number;
  name: string;
  logo?: string | null;
}

export default function BankDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<BankPaymentSubmission[]>([]);
  const [user, setUser] = useState<BankUser | null>(null);
  const [bank, setBank] = useState<Bank | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    amount: 0,
    verified: 0,
    pending: 0,
  });

  useEffect(() => {
    const initializePage = async () => {
      try {
        const userData = await getBankUser();
        setUser(userData);

        // Fetch bank associated with this user
        try {
          const rolesResponse = await api.get(`/user-roles/?user=${userData.id}`);
          const userRoles = rolesResponse.data.results || rolesResponse.data;
          if (userRoles.length > 0 && userRoles[0].bank) {
            const bankResponse = await api.get(`/banks/${userRoles[0].bank.id}/`);
            setBank(bankResponse.data);
          }
        } catch (error) {
          console.error('Error fetching bank:', error);
        }

        // Check if THIS user is bank staff (not just any staff exists)
        const rolesResponse = await api.get(`/user-roles/?user=${userData.id}&role=bank_staff`);
        const staffRoles = rolesResponse.data.results || rolesResponse.data;
        const isCurrentUserStaff = staffRoles.some((role: any) => role.user?.id === userData.id);
        setIsStaff(isCurrentUserStaff);
      } catch (error) {
        console.error('Error checking user role:', error);
      }

      await fetchSubmissions();
    };

    initializePage();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bank-payment-submissions/');
      let data = response.data.results || response.data;

      // Filter submissions by current user if they're staff
      if (isStaff && user) {
        data = data.filter((sub: BankPaymentSubmission) => sub.submitted_by_user === user.username);
      }

      setSubmissions(data);

      const total = data.length;
      const amount = data.reduce((sum: number, s: BankPaymentSubmission) => sum + s.amount, 0);
      const verified = data.filter((s: BankPaymentSubmission) => s.status === 'verified').length;
      const pending = data.filter((s: BankPaymentSubmission) => s.status === 'pending').length;

      setStats({ total, amount, verified, pending });
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><Loading /></Layout>;

  const statCards = [
    { icon: BiListUl, label: 'Total Submissions', value: stats.total, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    { icon: BiDollar, label: 'Total Amount', value: formatCurrency(stats.amount), color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    { icon: BiCheckCircle, label: 'Verified', value: stats.verified, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    { icon: BiHourglass, label: 'Pending', value: stats.pending, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-white p-8">
        {/* Bank Header */}
        {bank && (
          <div className="mb-8 pb-6 border-b border-gray-200 flex items-start gap-6">
            {bank.logo ? (
              <img src={bank.logo} alt={bank.name} className="h-16 w-16 object-contain" />
            ) : (
              <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏦</span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{bank.name}</h1>
              <p className="text-sm text-gray-500 mt-2">Payment Dashboard - Manage and submit payment batches</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
              <p className="text-sm text-gray-500 mt-2">Your latest payment submissions</p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <Link href="/dashboard/submit-payment">
                <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <BiPlus size={18} /> Manual Payment
                </Button>
              </Link>
              <Link href="/dashboard/bulk-upload">
                <Button variant="secondary" className="flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200">
                  <BiUpload size={18} /> Bulk Upload
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className={`${stat.bgColor} border ${stat.borderColor} rounded-lg p-6 hover:shadow-md transition-shadow`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color} mt-3`}>{stat.value}</p>
                  </div>
                  <Icon size={24} className={`${stat.color} opacity-20`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Submissions */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
          </div>
          {submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.slice(0, 10).map((sub, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{sub.id}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(sub.amount)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          sub.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(sub.submitted_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No submissions yet</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
