import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Button from '@/components/Common/Button';
import Alert from '@/components/Common/Alert';
import api from '@/lib/api';
import { generateReference } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PaymentFormData {
  // Pilgrim Info
  pilgrim_first_name: string;
  pilgrim_last_name: string;
  pilgrim_gender: 'M' | 'F';
  pilgrim_phone: string;
  pilgrim_email: string;
  // Payer Info
  payer_name: string;
  payer_contact: string;
  payer_relationship: string;
  // Payment Info
  amount: number;
  reference_number: string;
  payment_date: string;
  description: string;
}

export default function SubmitPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    pilgrim_first_name: '',
    pilgrim_last_name: '',
    pilgrim_gender: 'M',
    pilgrim_phone: '',
    pilgrim_email: '',
    payer_name: '',
    payer_contact: '',
    payer_relationship: 'Self',
    amount: 0,
    reference_number: generateReference(),
    payment_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) : value,
    }));
  };

  const handleGenerateReference = () => {
    setFormData((prev) => ({
      ...prev,
      reference_number: generateReference(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.pilgrim_first_name.trim() || !formData.pilgrim_last_name.trim()) {
      setError('Pilgrim first and last name are required');
      return;
    }
    if (!formData.payer_name.trim()) {
      setError('Payer name is required');
      return;
    }
    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      await api.post('/bank-payment-submissions/manual-submission/', formData);
      toast.success('Payment submitted successfully!');
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to submit payment';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Submit Payment</h1>
          <p className="text-gray-600 mt-1">Enter pilgrim details and payment information</p>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} />
        )}

        {success && (
          <Alert type="success" message="Payment submitted successfully! Redirecting..." />
        )}

        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Pilgrim Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">Pilgrim Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">First Name *</label>
                  <input
                    type="text"
                    name="pilgrim_first_name"
                    value={formData.pilgrim_first_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Hassan"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="pilgrim_last_name"
                    value={formData.pilgrim_last_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Jallow"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Gender *</label>
                  <select
                    name="pilgrim_gender"
                    value={formData.pilgrim_gender}
                    onChange={(e: any) => setFormData({ ...formData, pilgrim_gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none cursor-pointer"
                  >
                    <option value="M">Alagie (Male)</option>
                    <option value="F">Aja (Female)</option>
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Phone *</label>
                  <input
                    type="tel"
                    name="pilgrim_phone"
                    value={formData.pilgrim_phone}
                    onChange={handleInputChange}
                    placeholder="e.g., +220 3123456"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Email *</label>
                  <input
                    type="email"
                    name="pilgrim_email"
                    value={formData.pilgrim_email}
                    onChange={handleInputChange}
                    placeholder="e.g., hassan@example.com"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Payer Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">Payer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Payer Name *</label>
                  <input
                    type="text"
                    name="payer_name"
                    value={formData.payer_name}
                    onChange={handleInputChange}
                    placeholder="Full name of person making deposit"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Payer Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Payer Contact/ID</label>
                  <input
                    type="text"
                    name="payer_contact"
                    value={formData.payer_contact}
                    onChange={handleInputChange}
                    placeholder="Phone, ID, or account number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Relationship */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Relationship to Pilgrim</label>
                  <select
                    name="payer_relationship"
                    value={formData.payer_relationship}
                    onChange={(e: any) => setFormData({ ...formData, payer_relationship: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none cursor-pointer"
                  >
                    <option value="Self">Self</option>
                    <option value="Parent">Parent</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other Family">Other Family</option>
                    <option value="Friend">Friend</option>
                    <option value="Employer">Employer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Amount (GMD) *</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Payment Date *</label>
                  <input
                    type="date"
                    name="payment_date"
                    value={formData.payment_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Reference Number */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Reference Number *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="reference_number"
                      value={formData.reference_number}
                      readOnly
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleGenerateReference}
                    >
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Auto-generated unique reference for this transaction</p>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Description (Optional)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Additional notes about this payment..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Button
                type="submit"
                loading={loading}
                className="flex-1 bg-black hover:bg-gray-900 text-white"
              >
                Submit Payment
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-900 mb-2">💡 Important:</p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• All pilgrim information will be recorded with this payment</li>
            <li>• Payer information helps track who made the deposit</li>
            <li>• Reference number must be unique for each transaction</li>
            <li>• All amounts are in Gambian Dalasi (GMD)</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
