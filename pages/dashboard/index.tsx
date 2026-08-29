'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Loading from '@/components/Common/Loading';
import Button from '@/components/Common/Button';
import { DashboardSkeleton, StatCardSkeleton } from '@/components/Common/Skeleton';
import { BankPaymentSubmission, BankUser } from '@/types';
import api from '@/lib/api';
import { getBankUser } from '@/lib/auth';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { BiUpload, BiPlus, BiCheckCircle, BiHourglass, BiListUl, BiDollar, BiChevronRight } from 'react-icons/bi';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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

        const rolesResponse = await api.get(`/user-roles/?user=${userData.id}&role=bank_admin`);
        const adminRoles = rolesResponse.data.results || rolesResponse.data;
        const isCurrentUserAdmin = adminRoles.some((role: any) => role.user?.id === userData.id);
        setIsAdmin(isCurrentUserAdmin);
      } catch (error) {
        console.error('Error checking user role:', error);
      }

      await fetchSubmissions();
    };

    initializePage();
  }, [selectedDate]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bank-payment-submissions/');
      let data = response.data.results || response.data;

      // Filter by date (YYYY-MM-DD format)
      data = data.filter((sub: BankPaymentSubmission) => {
        const submissionDate = new Date(sub.submitted_at).toISOString().split('T')[0];
        return submissionDate === selectedDate;
      });

      // Tellers can only see their own records
      // If NOT an admin (i.e., they're a teller), filter to show only their records
      if (!isAdmin && user) {
        data = data.filter((sub: BankPaymentSubmission) => sub.submitted_by_user === user.username);
      }
      // Admins can see all records (already filtered by date above)

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

  if (loading) return <Layout><div className="min-h-screen bg-white p-8"><DashboardSkeleton /></div></Layout>;

  const statCards = [
    { icon: BiListUl, label: 'Total Submissions', value: stats.total, color: 'text-gray-600' },
    { icon: BiDollar, label: 'Total Amount', value: formatCurrency(stats.amount), color: 'text-gray-600' },
    { icon: BiCheckCircle, label: 'Verified', value: stats.verified, color: 'text-emerald-600' },
    { icon: BiHourglass, label: 'Pending', value: stats.pending, color: 'text-amber-600' },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-white p-8">
        {/* Page Header */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {bank && (
                <>
                  {bank.logo ? (
                    <img src={bank.logo} alt={bank.name} className="h-12 w-12 object-contain" />
                  ) : (
                    <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center text-lg">🏦</div>
                  )}
                  <div>
                    <h1 className="text-3xl font-semibold text-gray-900">{bank.name}</h1>
                    <p className="text-sm text-gray-600 mt-1">Payment Processing Dashboard</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 items-center">
              {isAdmin && (
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-600 mb-1">Filter by Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              <Link href="/dashboard/submit-payment">
                <Button className="flex items-center gap-2 bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  <BiPlus size={16} /> Manual Payment
                </Button>
              </Link>
              <Link href="/dashboard/bulk-upload">
                <Button className="flex items-center gap-2 border border-gray-300 text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium">
                  <BiUpload size={16} /> Bulk Upload
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color} mt-3 font-mono`}>{stat.value}</p>
                  </div>
                  <Icon size={20} className="text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Submissions */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent Submissions</h2>
            <p className="text-xs text-gray-500">{submissions.length} total</p>
          </div>
          {submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.slice(0, 10).map((sub, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 text-sm font-mono text-gray-500">#{sub.id}</td>
                      <td className="px-6 py-3.5 text-sm font-mono font-medium text-gray-900">{formatCurrency(sub.amount)}</td>
                      <td className="px-6 py-3.5 text-sm">
                        <span className={`px-2.5 py-1 rounded text-xs font-medium inline-block ${
                          sub.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">{formatDate(sub.submitted_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 text-sm">No submissions yet</p>
              <Link href="/dashboard/submit-payment">
                <span className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 mt-3 cursor-pointer font-medium">
                  Create one now <BiChevronRight size={14} />
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
