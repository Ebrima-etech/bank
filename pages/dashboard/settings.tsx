'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { BiArrowBack, BiUpload, BiCheck } from 'react-icons/bi';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getBankUser } from '@/lib/auth';

interface Bank {
  id: number;
  name: string;
  logo?: string | null;
  contact_email?: string;
  contact_phone?: string;
  created_at?: string;
}

export default function BankSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bank, setBank] = useState<Bank | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    fetchBankData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBankData = async () => {
    try {
      setLoading(true);
      const user = await getBankUser();
      const rolesResponse = await api.get(`/user-roles/?user=${user.id}`);
      const userRoles = rolesResponse.data.results || rolesResponse.data;

      if (userRoles.length > 0 && userRoles[0].bank) {
        const bankResponse = await api.get(`/banks/${userRoles[0].bank.id}/`);
        setBank(bankResponse.data);
        setImageLoadError(false);
      }
    } catch (error) {
      console.error('Error fetching bank:', error);
      toast.error('Failed to load bank settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !bank) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('logo', file);

      console.log('Uploading logo:', file.name);
      const response = await api.patch(`/banks/${bank.id}/`, formData);

      console.log('Upload response:', response.data);
      setBank(response.data);
      setImageLoadError(false);

      // Clear the file input
      e.target.value = '';

      toast.success('Bank logo uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-white p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⚙️</div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-white p-8">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
            >
              <BiArrowBack size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Bank Settings</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your bank information</p>
            </div>
          </div>
        </div>

        {/* Bank Settings Card */}
        {bank && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Bank Logo</h2>

            {/* Logo Display Section */}
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-6">
                {/* Logo Preview */}
                <div className="flex flex-col items-center">
                  <div className="w-40 h-40 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center mb-4">
                    {bank.logo && !imageLoadError ? (
                      <img
                        key={bank.logo}
                        src={bank.logo}
                        alt={bank.name}
                        className="h-36 w-36 object-contain"
                        onLoad={() => console.log('Logo loaded successfully')}
                        onError={() => {
                          console.log('Image load failed for:', bank.logo);
                          setImageLoadError(true);
                        }}
                      />
                    ) : (
                      <span className="text-6xl">🏦</span>
                    )}
                  </div>
                  <label className="w-full px-3 py-2 bg-black hover:bg-gray-900 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors text-center">
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Bank Info */}
                <div className="flex-1">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Bank Name</p>
                      <p className="text-lg font-semibold text-gray-900 mt-2">{bank.name}</p>
                    </div>
                    {bank.contact_email && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Contact Email</p>
                        <p className="text-sm text-gray-900 mt-2">{bank.contact_email}</p>
                      </div>
                    )}
                    {bank.contact_phone && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Contact Phone</p>
                        <p className="text-sm text-gray-900 mt-2">{bank.contact_phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload Info */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <BiUpload className="text-blue-600 mt-1" size={18} />
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Logo Upload</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Upload your bank's logo to display it on your payment processing dashboard.
                      The logo will be stored securely and available across all sessions.
                    </p>
                    <ul className="text-xs text-blue-600 mt-2 space-y-1">
                      <li>✓ Supported formats: PNG, JPG, GIF, SVG</li>
                      <li>✓ Maximum file size: 10MB</li>
                      <li>✓ Recommended size: 400x400px or larger</li>
                      <li>✓ Logo is permanently stored and persists across server restarts</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
