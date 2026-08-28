import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Loading from '@/components/Common/Loading';
import Button from '@/components/Common/Button';
import { BankPaymentSubmission } from '@/types';
import api from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

export default function BankDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<BankPaymentSubmission[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    amount: 0,
    verified: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bank-payment-submissions/');
      const data = response.data.results || response.data;
      setSubmissions(data);

      // Calculate stats
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

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 p-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bank Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage and submit payment batches</p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Link href="/dashboard/submit-payment">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">+ Manual Payment</Button>
            </Link>
            <Link href="/dashboard/bulk-upload">
              <Button variant="secondary" className="bg-amber-100 text-amber-900 hover:bg-amber-200">📤 Bulk Upload</Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition">
            <p className="text-sm font-medium text-gray-600">Total Submissions</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition">
            <p className="text-sm font-medium text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-amber-600 mt-2">{formatCurrency(stats.amount)}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition">
            <p className="text-sm font-medium text-gray-600">✓ Verified</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{stats.verified}</p>
          </div>
          <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition">
            <p className="text-sm font-medium text-gray-600">⏳ Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-2">{stats.pending}</p>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-200 bg-amber-50">
            <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50 border-b border-amber-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Pilgrim ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {submissions.length > 0 ? (
                  submissions.slice(0, 10).map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-semibold text-primary-600">{submission.reference_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{submission.pilgrim_id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(submission.amount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{submission.submission_method.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(submission.submitted_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No submissions yet. <Link href="/dashboard/submit-payment" className="text-primary-600 font-medium">Submit your first payment</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/dashboard/submit-payment" className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-md transition">
            <div className="text-2xl mb-2">📝</div>
            <h3 className="font-semibold text-gray-900">Submit Payment</h3>
            <p className="text-sm text-gray-600 mt-1">Enter pilgrim and payment details manually</p>
          </Link>

          <Link href="/dashboard/bulk-upload" className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 hover:shadow-md transition">
            <div className="text-2xl mb-2">📤</div>
            <h3 className="font-semibold text-gray-900">Bulk Upload</h3>
            <p className="text-sm text-gray-600 mt-1">Upload multiple payments via CSV file</p>
          </Link>

          <Link href="/dashboard/api-integration" className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 hover:shadow-md transition">
            <div className="text-2xl mb-2">🔌</div>
            <h3 className="font-semibold text-gray-900">API Integration</h3>
            <p className="text-sm text-gray-600 mt-1">Integrate via API webhook or Postman</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
