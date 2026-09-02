'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Loading from '@/components/Common/Loading';
import Button from '@/components/Common/Button';
import { DashboardSkeleton, StatCardSkeleton } from '@/components/Common/Skeleton';
import ReceiptModal from '@/components/ReceiptModal';
import { BankPaymentSubmission, BankUser } from '@/types';
import api from '@/lib/api';
import { getBankUser } from '@/lib/auth';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { BiUpload, BiPlus, BiCheckCircle, BiHourglass, BiListUl, BiDollar, BiChevronRight, BiShow, BiHide, BiCog, BiBarChart, BiReceipt } from 'react-icons/bi';

interface Bank {
  id: number;
  name: string;
  logo?: string | null;
  is_active?: boolean;
  access_restricted?: boolean;
  allowed_days?: string;
  access_start_time?: string;
  access_end_time?: string;
  location_restricted?: boolean;
  location_latitude?: number;
  location_longitude?: number;
  location_radius?: number;
}

export default function BankDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<BankPaymentSubmission[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<BankPaymentSubmission[]>([]);
  const [user, setUser] = useState<BankUser | null>(null);
  const [bank, setBank] = useState<Bank | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bankInactive, setBankInactive] = useState(false);
  const [timeRestricted, setTimeRestricted] = useState(false);
  const [locationRestricted, setLocationRestricted] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTeller, setSelectedTeller] = useState('');
  const [tellers, setTellers] = useState<any[]>([]);
  const [paymentAccessLevel, setPaymentAccessLevel] = useState<'date_restricted' | 'unrestricted'>('date_restricted');
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(new Set());
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [generatedReceipts, setGeneratedReceipts] = useState<Set<string>>(new Set());
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    amount: 0,
    verified: 0,
    pending: 0,
  });

  const handleOpenReceipt = (submission: BankPaymentSubmission) => {
    console.log('Opening receipt for submission:', submission);
    setGeneratingReceipt(true);

    // Format date as YYYY-MM-DD for backend - use submitted_at directly
    const formatDateForBackend = (dateStr: any) => {
      if (!dateStr) return new Date().toISOString().split('T')[0];

      // Convert to string if needed
      const dateString = String(dateStr);

      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

      // Parse the date
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return new Date().toISOString().split('T')[0];
      }

      return date.toISOString().split('T')[0];
    };

    const referenceNumber = submission.reference_number || `REF${submission.id}`;

    const receiptData: any = {
      pilgrim_first_name: submission.pilgrim?.first_name || 'Unknown',
      pilgrim_last_name: submission.pilgrim?.last_name || 'Unknown',
      pilgrim_phone: submission.pilgrim?.phone_number || '',
      pilgrim_email: submission.pilgrim?.email || '',
      pilgrim_passport_number: submission.pilgrim?.passport_number || '',
      pilgrim_date_of_birth: submission.pilgrim?.date_of_birth || '',
      pilgrim_gender: submission.pilgrim?.gender || 'M',
      amount: submission.amount || 0,
      reference_number: referenceNumber,
      payment_date: formatDateForBackend(submission.submitted_at),
      registration_id: `REC${submission.id}`,
      payer_name: submission.payer_name || 'Unknown',
      payer_relationship: submission.payer_relationship || '',
      payment_id: submission.payment,
    };

    console.log('Formatted payment_date:', receiptData.payment_date, 'from:', submission.submitted_at);
    console.log('Receipt data with payment_id:', receiptData);
    setSelectedReceipt(receiptData);
  };

  const handleReceiptSaved = () => {
    setGeneratingReceipt(false);
  };

  const handleCloseReceipt = () => {
    setSelectedReceipt(null);
    setGeneratingReceipt(false);
  };

  const handleReceiptGenerated = (submissionId: string) => {
    setGeneratedReceipts(prev => new Set(prev).add(submissionId));
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const checkTimeAccess = (bankData: Bank): boolean => {
    // If time restrictions are not enabled, allow access
    if (!bankData.access_restricted) {
      return true;
    }

    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = dayNames[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Check if today is an allowed day
    const allowedDays = bankData.allowed_days?.split(',').map(d => d.trim()) || [];
    if (!allowedDays.includes(currentDay)) {
      return false;
    }

    // Check if current time is within allowed range
    if (bankData.access_start_time && bankData.access_end_time) {
      if (currentTime < bankData.access_start_time || currentTime > bankData.access_end_time) {
        return false;
      }
    }

    return true;
  };

  const checkLocationAccess = async (bankData: Bank) => {
    // If location restrictions are not enabled, allow access
    if (!bankData.location_restricted) {
      return true;
    }

    // Get user's current location
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            setUserLocation({ lat: userLat, lng: userLng });

            // Check if user is within allowed radius
            if (bankData.location_latitude && bankData.location_longitude && bankData.location_radius) {
              const distance = calculateDistance(
                userLat,
                userLng,
                bankData.location_latitude,
                bankData.location_longitude
              );

              const isWithinRadius = distance <= bankData.location_radius;
              if (!isWithinRadius) {
                setLocationRestricted(true);
                setLoading(false);
              }
              resolve(isWithinRadius);
            } else {
              resolve(true);
            }
          },
          () => {
            // Geolocation failed - deny access if location restrictions are enabled
            setLocationRestricted(true);
            setLoading(false);
            resolve(false);
          }
        );
      } else {
        // Geolocation not available - deny access if location restrictions are enabled
        setLocationRestricted(true);
        setLoading(false);
        resolve(false);
      }
    });
  };

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
            setPaymentAccessLevel(bankResponse.data.payment_view_access || 'date_restricted');

            // Check if bank is inactive
            if (bankResponse.data.is_active === false) {
              setBankInactive(true);
              setLoading(false);
              return;
            }

            // Check time-based access restrictions
            const hasTimeAccess = checkTimeAccess(bankResponse.data);
            if (!hasTimeAccess) {
              setTimeRestricted(true);
              setLoading(false);
              return;
            }

            // Check location restrictions
            const hasLocationAccess = await checkLocationAccess(bankResponse.data);
            if (!hasLocationAccess) {
              return;
            }
          }
        } catch (error) {
          console.error('Error fetching bank:', error);
        }

        const rolesResponse = await api.get(`/user-roles/?user=${userData.id}&role=bank_admin`);
        const adminRoles = rolesResponse.data.results || rolesResponse.data;
        const isCurrentUserAdmin = adminRoles.some((role: any) => role.user?.id === userData.id);
        setIsAdmin(isCurrentUserAdmin);

        // Fetch tellers for filter
        await fetchTellers();

        // Pass isCurrentUserAdmin directly to avoid race condition
        await fetchSubmissions(isCurrentUserAdmin, userData);
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };

    initializePage();
  }, [selectedDate, selectedTeller]);

  const toggleFieldVisibility = (fieldId: string) => {
    const newHidden = new Set(hiddenFields);
    if (newHidden.has(fieldId)) {
      newHidden.delete(fieldId);
    } else {
      newHidden.add(fieldId);
    }
    setHiddenFields(newHidden);
  };

  const isFieldHidden = (fieldId: string) => hiddenFields.has(fieldId);

  const fetchTellers = async () => {
    try {
      const response = await api.get('/user-roles/?role=bank_staff');
      const tellersList = response.data.results || response.data;
      setTellers(tellersList);
    } catch (error) {
      console.error('Error fetching tellers:', error);
    }
  };

  const fetchSubmissions = async (isAdminUser?: boolean, currentUser?: BankUser) => {
    try {
      setLoading(true);
      const response = await api.get('/bank-payment-submissions/');
      let data = response.data.results || response.data;
      setAllSubmissions(data);

      const username = currentUser?.username || user?.username;
      const adminStatus = isAdminUser !== undefined ? isAdminUser : isAdmin;

      console.log('DEBUG: All submissions fetched:', data.length);
      console.log('DEBUG: Current user:', username);
      console.log('DEBUG: Is admin:', adminStatus);
      console.log('DEBUG: Selected date:', selectedDate);
      console.log('DEBUG: Access level:', paymentAccessLevel);

      // Calculate cumulative stats from ALL data (before filtering for display)
      const cumulativeTotal = data.length;
      const cumulativeAmount = data.reduce((sum: number, s: BankPaymentSubmission) => sum + s.amount, 0);
      const cumulativeVerified = data.filter((s: BankPaymentSubmission) => s.status === 'verified').length;
      const cumulativePending = data.filter((s: BankPaymentSubmission) => s.status === 'pending').length;

      // For admins with date_restricted access, apply date filter for DISPLAY only
      // For unrestricted access, show all submissions
      if (adminStatus && paymentAccessLevel === 'date_restricted') {
        data = data.filter((sub: BankPaymentSubmission) => {
          const submissionDate = new Date(sub.submitted_at).toISOString().split('T')[0];
          return submissionDate === selectedDate;
        });
      }

      console.log('DEBUG: After access level filter:', data.length);

      // Filter by teller if admin selected one
      if (adminStatus && selectedTeller) {
        data = data.filter((sub: BankPaymentSubmission) => sub.submitted_by_user === selectedTeller);
      }

      // Tellers can only see their own records
      // If NOT an admin (i.e., they're a teller), filter to show only their records
      if (!adminStatus && username) {
        console.log('DEBUG: Applying teller filter for user:', username);
        data = data.filter((sub: BankPaymentSubmission) => {
          const match = sub.submitted_by_user === username;
          console.log(`DEBUG: Checking ${sub.submitted_by_user} === ${username} => ${match}`);
          return match;
        });
        console.log('DEBUG: After user filter:', data.length);
      } else {
        console.log('DEBUG: Admin user, showing all records');
      }

      setSubmissions(data);

      // Use cumulative stats (not filtered) for stats cards
      setStats({
        total: cumulativeTotal,
        amount: cumulativeAmount,
        verified: cumulativeVerified,
        pending: cumulativePending
      });
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><div className="min-h-screen bg-white p-8"><DashboardSkeleton /></div></Layout>;

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
              {bank?.name ? `${bank.name} has been` : 'Your bank has been'} marked as <span className="font-semibold">inactive</span>.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Bank staff and administrators cannot access the portal while the bank is inactive. Please contact GIA for assistance.
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

  if (timeRestricted) {
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5);
    return (
      <Layout>
        <div className="min-h-screen bg-white p-8 flex items-center justify-center">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                <span className="text-3xl">⏰</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Outside Business Hours</h1>
            <p className="text-gray-600 mb-2">
              {bank?.name ? `${bank.name}'s portal` : 'The portal'} is only available during specific business hours.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Please access the portal during the authorized days and times set by your administrator.
            </p>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
              <p className="text-sm text-amber-700 font-medium mb-2">
                Current: {currentDay} at {currentTime}
              </p>
              {bank?.access_restricted && bank?.access_start_time && bank?.access_end_time && (
                <p className="text-xs text-amber-600">
                  Authorized: {bank.allowed_days} • {bank.access_start_time} - {bank.access_end_time}
                </p>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-black hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Check Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (locationRestricted) {
    return (
      <Layout>
        <div className="min-h-screen bg-white p-8 flex items-center justify-center">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <span className="text-3xl">📍</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Location Access Denied</h1>
            <p className="text-gray-600 mb-2">
              {bank?.name ? `${bank.name}'s portal` : 'The portal'} requires access from a specific geographic location.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Your current location is outside the allowed access zone. Please move to the authorized location and try again.
            </p>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              {userLocation ? (
                <>
                  <p className="text-sm text-red-700 font-medium mb-2">
                    Your Location: {userLocation.lat.toFixed(4)}°, {userLocation.lng.toFixed(4)}°
                  </p>
                  {bank?.location_latitude && bank?.location_longitude && bank?.location_radius && (
                    <p className="text-xs text-red-600">
                      Authorized: {bank.location_latitude.toFixed(4)}°, {bank.location_longitude.toFixed(4)}° (±{bank.location_radius}km radius)
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ Unable to determine your location
                </p>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-black hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const statCards = [
    { icon: BiListUl, label: 'Total Submissions', value: stats.total, color: 'text-gray-600', isFinancial: false },
    { icon: BiDollar, label: 'Total Amount', value: stats.amount, color: 'text-gray-600', isFinancial: true, fieldId: 'total-amount' },
    { icon: BiCheckCircle, label: 'Verified', value: stats.verified, color: 'text-emerald-600', isFinancial: false },
    { icon: BiHourglass, label: 'Pending', value: stats.pending, color: 'text-amber-600', isFinancial: false },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-white p-8">
        {/* Page Header */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="https://strapi.yolcu360.com/gambia_airlines_logo_1_ebe63e51ad.png" alt="GIA Hajj" className="h-48 w-48 object-contain" />
              <div>
                <h1 className="text-3xl font-semibold text-emerald-700">GIA Hajj</h1>
                <p className="text-sm text-emerald-600 mt-1">Serving the Guests of Allah</p>
              </div>
            </div>
            <div className="flex gap-3 items-center flex-wrap">
              {isAdmin && (
                <>
                  {paymentAccessLevel === 'date_restricted' ? (
                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-gray-600 mb-1">🔒 Filter by Date (Required)</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                      <p className="text-xs font-medium text-emerald-700">🔓 Unrestricted Access</p>
                      <p className="text-xs text-emerald-600">Viewing all payments - no date restriction</p>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-600 mb-1">Filter by Teller</label>
                    <select
                      value={selectedTeller}
                      onChange={(e) => setSelectedTeller(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
                    >
                      <option value="">All Tellers</option>
                      {tellers.map((teller) => (
                        <option key={teller.id} value={teller.user.username}>
                          @{teller.user.username}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
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
              {isAdmin && (
                <Link href="/dashboard/settings">
                  <Button className="flex items-center gap-2 border border-gray-300 text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium">
                    <BiCog size={16} /> Settings
                  </Button>
                </Link>
              )}
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
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{stat.label}</p>
                      {stat.isFinancial && stat.fieldId && (
                        <button
                          onClick={() => toggleFieldVisibility(stat.fieldId)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title={isFieldHidden(stat.fieldId) ? 'Show' : 'Hide'}
                        >
                          {isFieldHidden(stat.fieldId) ? <BiHide size={14} className="text-gray-600" /> : <BiShow size={14} className="text-gray-600" />}
                        </button>
                      )}
                    </div>
                    <p className={`text-2xl font-bold ${stat.color} mt-3 font-mono`}>
                      {stat.isFinancial && stat.fieldId && isFieldHidden(stat.fieldId) ? '••••••' : (stat.isFinancial ? formatCurrency(stat.value as number) : stat.value)}
                    </p>
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
                    {isAdmin && <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Teller</th>}
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.slice(0, 10).map((sub, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 text-sm font-mono text-gray-500">#{sub.id}</td>
                      <td className="px-6 py-3.5 text-sm font-mono font-medium text-gray-900">
                        <div className="flex items-center justify-between gap-2">
                          <span>{isFieldHidden(`submission-${sub.id}`) ? '••••••' : formatCurrency(sub.amount)}</span>
                          <button
                            onClick={() => toggleFieldVisibility(`submission-${sub.id}`)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title={isFieldHidden(`submission-${sub.id}`) ? 'Show' : 'Hide'}
                          >
                            {isFieldHidden(`submission-${sub.id}`) ? <BiHide size={14} className="text-gray-600" /> : <BiShow size={14} className="text-gray-600" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm">
                        <span className={`px-2.5 py-1 rounded text-xs font-medium inline-block ${
                          sub.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                        </span>
                      </td>
                      {isAdmin && <td className="px-6 py-3.5 text-sm font-medium text-gray-700">@{sub.submitted_by_user || 'N/A'}</td>}
                      <td className="px-6 py-3.5 text-sm text-gray-600">{formatDate(sub.submitted_at)}</td>
                      <td className="px-6 py-3.5 text-sm">
                        <button
                          onClick={() => handleOpenReceipt(sub)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            generatedReceipts.has(sub.id)
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                          title={generatedReceipts.has(sub.id) ? "View receipt" : "Generate receipt"}
                        >
                          <BiReceipt size={16} />
                          {generatedReceipts.has(sub.id) ? 'View Receipt' : 'Generate Receipt'}
                        </button>
                      </td>
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

      {selectedReceipt && (
        <>
          {generatingReceipt && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
                <div className="mb-6 flex justify-center">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Receipt</h3>
                <p className="text-gray-600">Please wait while we prepare your receipt...</p>
              </div>
            </div>
          )}

          {!generatingReceipt && (
            <ReceiptModal
              data={selectedReceipt}
              onClose={() => handleCloseReceipt()}
              onReceiptSaved={() => {
                handleReceiptSaved();
                // Find the submission ID from the data and mark it as generated
                const submissionId = submissions.find(sub =>
                  sub.reference_number === selectedReceipt.reference_number ||
                  sub.id === parseInt(selectedReceipt.registration_id?.replace('REC', ''))
                )?.id;
                if (submissionId) {
                  handleReceiptGenerated(submissionId);
                }
              }}
            />
          )}

          {generatingReceipt && (
            <ReceiptModal
              data={selectedReceipt}
              onClose={() => handleCloseReceipt()}
              onReceiptSaved={() => {
                handleReceiptSaved();
                // Find the submission ID from the data and mark it as generated
                const submissionId = submissions.find(sub =>
                  sub.reference_number === selectedReceipt.reference_number ||
                  sub.id === parseInt(selectedReceipt.registration_id?.replace('REC', ''))
                )?.id;
                if (submissionId) {
                  handleReceiptGenerated(submissionId);
                }
              }}
            />
          )}
        </>
      )}
        />
      )}
    </Layout>
  );
}
