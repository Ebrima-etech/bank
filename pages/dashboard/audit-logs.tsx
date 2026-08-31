'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Common/Button';
import { useBankContext } from '@/lib/BankContext';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { BiSearch, BiDownload, BiRefresh, BiChevronLeft, BiChevronRight, BiFilter, BiBarChart, BiLock, BiDollar, BiCheckCircle, BiPencil, BiTrash, BiLogIn, BiLogOut } from 'react-icons/bi';
import toast from 'react-hot-toast';

interface AuditLog {
  id: number;
  user: { username: string; email: string } | string;
  action: string;
  model_name: string;
  object_id: number;
  description: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

export default function AuditLogsPage() {
  const { isAdmin, loading: contextLoading } = useBankContext();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedTeller, setSelectedTeller] = useState('all');
  const [tellers, setTellers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const actions = ['all', 'submit_payment', 'verify_payment', 'update_payment', 'delete_payment', 'login', 'logout'];

  const getActionIcon = (action: string) => {
    const iconProps = { size: 14, className: 'inline mr-1' };
    const icons: Record<string, React.ReactNode> = {
      submit_payment: <BiDollar {...iconProps} />,
      verify_payment: <BiCheckCircle {...iconProps} />,
      update_payment: <BiPencil {...iconProps} />,
      delete_payment: <BiTrash {...iconProps} />,
      login: <BiLogIn {...iconProps} />,
      logout: <BiLogOut {...iconProps} />,
    };
    return icons[action] || null;
  };

  const actionLabels: Record<string, string> = {
    all: 'All Actions',
    submit_payment: 'Submit Payment',
    verify_payment: 'Verify Payment',
    update_payment: 'Update Payment',
    delete_payment: 'Delete Payment',
    login: 'Login',
    logout: 'Logout',
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchTellers();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAuditLogs();
  }, [isAdmin, dateRange]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, selectedAction, selectedTeller]);

  const fetchTellers = async () => {
    try {
      const response = await api.get('/user-roles/?role=bank_staff');
      const tellersList = response.data.results || response.data;
      setTellers(tellersList);
    } catch (error) {
      console.error('Error fetching tellers:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (dateRange.start) {
        params.created_at__gte = `${dateRange.start}T00:00:00`;
      }
      if (dateRange.end) {
        params.created_at__lte = `${dateRange.end}T23:59:59`;
      }

      const response = await api.get('/audit-logs/', { params });
      const data = response.data.results || response.data || [];
      setLogs(data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMockAuditLogs = async () => {
    try {
      const response = await api.get('/bank-payment-submissions/');
      const payments = response.data.results || response.data || [];

      // Generate mock audit logs from payments
      const mockLogs: AuditLog[] = payments.map((payment: any, idx: number) => ({
        id: idx + 1,
        user: payment.submitted_by_user || 'Unknown',
        action: 'submit_payment',
        resource_type: 'payment',
        resource_id: payment.id,
        changes: {
          amount: payment.amount,
          status: payment.status,
          bank: payment.bank,
        },
        timestamp: payment.submitted_at,
        details: `Payment #${payment.id} submitted for ${payment.pilgrim_name}`,
      }));

      setLogs(mockLogs);
    } catch (error) {
      console.error('Error fetching mock audit logs:', error);
      setLogs([]);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((log) => {
        const userStr = typeof log.user === 'string' ? log.user : log.user.username;
        return (
          userStr.toLowerCase().includes(term) ||
          log.action.toLowerCase().includes(term) ||
          log.object_id.toString().includes(term) ||
          log.description?.toLowerCase().includes(term)
        );
      });
    }

    // Filter by action
    if (selectedAction !== 'all') {
      filtered = filtered.filter((log) => log.action === selectedAction);
    }

    // Filter by teller
    if (selectedTeller !== 'all') {
      filtered = filtered.filter((log) => {
        const userStr = typeof log.user === 'string' ? log.user : log.user.username;
        return userStr === selectedTeller;
      });
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const exportLogs = async () => {
    try {
      const csv = [
        ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'Details'].join(','),
        ...filteredLogs.map((log) => {
          const userStr = typeof log.user === 'string' ? log.user : log.user.username;
          return [
            formatDate(log.created_at),
            userStr,
            log.action,
            log.model_name,
            log.object_id,
            log.description || '',
          ]
            .map((val) => `"${val}"`)
            .join(',');
        }),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Audit logs exported');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Failed to export logs');
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="min-h-screen bg-white p-8 flex items-center justify-center">
          <div className="max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <BiLock size={48} className="text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">Only bank administrators can view audit logs.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      submit_payment: 'bg-blue-50 text-blue-700 border-blue-200',
      verify_payment: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      update_payment: 'bg-amber-50 text-amber-700 border-amber-200',
      delete_payment: 'bg-red-50 text-red-700 border-red-200',
      login: 'bg-green-50 text-green-700 border-green-200',
      logout: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return colors[action] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white p-8">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BiBarChart size={32} className="text-emerald-600" />
                <h1 className="text-3xl font-semibold text-gray-900">Teller Audit Logs</h1>
              </div>
              <p className="text-gray-600 mt-1">Monitor all teller activities and transactions</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={fetchAuditLogs}
                className="flex items-center gap-2 border border-gray-300 text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium"
              >
                <BiRefresh size={16} /> Refresh
              </Button>
              <Button
                onClick={exportLogs}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                <BiDownload size={16} /> Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">From Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">To Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Action</label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
              >
                {actions.map((action) => (
                  <option key={action} value={action}>
                    {actionLabels[action]}
                  </option>
                ))}
              </select>
            </div>

            {/* Teller Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Teller</label>
              <select
                value={selectedTeller}
                onChange={(e) => setSelectedTeller(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
              >
                <option value="all">All Tellers</option>
                {tellers.map((teller) => (
                  <option key={teller.id} value={teller.user.username}>
                    @{teller.user.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Search</label>
              <div className="relative">
                <BiSearch className="absolute left-3 top-3 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="User, action, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-600 uppercase">Total Logs</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{logs.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-600 uppercase">Filtered</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{filteredLogs.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-600 uppercase">Unique Tellers</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{new Set(logs.map((l) => l.user)).size}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-600 uppercase">Date Range</p>
            <p className="text-sm font-medium text-gray-900 mt-2">{dateRange.start} to {dateRange.end}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Timestamp</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Teller</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Action</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Resource</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => {
                    const userStr = typeof log.user === 'string' ? log.user : log.user.username;
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-sm text-gray-600 font-mono">{formatDate(log.created_at)}</td>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">@{userStr}</td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${getActionBadgeColor(log.action)}`}>
                            {getActionIcon(log.action)}
                            {actionLabels[log.action] || log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {log.model_name} #{log.object_id}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600 max-w-xs truncate" title={log.description}>
                          {log.description || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of{' '}
              {filteredLogs.length} logs
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BiChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    currentPage === page
                      ? 'bg-emerald-600 text-white'
                      : 'border border-gray-300 text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BiChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
