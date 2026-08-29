import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Button from '@/components/Common/Button';
import Alert from '@/components/Common/Alert';
import { ManualPaymentData } from '@/types';
import api from '@/lib/api';
import { generateReference } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SubmitPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<ManualPaymentData>({
    pilgrim_id: '', // Will be filled by backend search/lookup
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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Submit Payment</h1>
          <p className="text-gray-600 mt-1">Enter payment details for a pilgrim</p>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} />
        )}

        {success && (
          <Alert type="success" message="Payment submitted successfully! Redirecting..." />
        )}

        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Payment Amount (USD) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Reference Number *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="reference_number"
                  value={formData.reference_number}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
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

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Payment Date *
              </label>
              <input
                type="date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Additional notes about this payment..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Button
                type="submit"
                loading={loading}
                className="flex-1"
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
          <p className="text-sm font-semibold text-blue-900 mb-2">💡 Tips:</p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Pilgrim ID must be in GHXXXXX format</li>
            <li>• Reference number must be unique for each transaction</li>
            <li>• Payment date cannot be in the future</li>
            <li>• Amount should match the pilgrim's outstanding balance</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
