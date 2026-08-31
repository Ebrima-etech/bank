import { useState } from 'react';
import { useRouter } from 'next/router';
import Alert from './Common/Alert';
import api from '@/lib/api';
import { generateReference } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CurrentDepositFormProps {
  onBack: () => void;
}

export default function CurrentDepositForm({ onBack }: CurrentDepositFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [step, setStep] = useState<'lookup' | 'deposit'>('lookup');
  const [pilgrimId, setPilgrimId] = useState('');
  const [phone, setPhone] = useState('');
  const [pilgrimData, setPilgrimData] = useState<any>(null);

  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState(generateReference());
  const [description, setDescription] = useState('');

  // Payer info
  const [payerName, setPayerName] = useState('');
  const [payerContact, setPayerContact] = useState('');
  const [payerRelationship, setPayerRelationship] = useState('Self');
  const [otherRelationship, setOtherRelationship] = useState('');

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!pilgrimId.trim() && !phone.trim()) {
      setError('Enter either Pilgrim ID or Phone Number');
      return;
    }

    setLoading(true);
    try {
      // Try to find pilgrim by ID or phone
      const response = await api.get('/pilgrims/', {
        params: {
          search: pilgrimId || phone,
        },
      });

      const pilgrims = response.data.results || response.data;
      if (pilgrims.length === 0) {
        setError('Pilgrim not found. Check ID or phone number.');
        return;
      }

      setPilgrimData(pilgrims[0]);
      setStep('deposit');
    } catch (err: any) {
      console.error('Lookup error:', err);
      setError('Failed to lookup pilgrim');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }

    if (!payerName.trim()) {
      setError('Enter payer name');
      return;
    }

    setLoading(true);
    try {
      const depositData = {
        // Existing pilgrim ID
        pilgrim_id: pilgrimData.registration_id,
        // Payer info from form
        payer_name: payerName,
        payer_contact: payerContact,
        payer_relationship: payerRelationship === 'Other' ? otherRelationship : payerRelationship,
        // Deposit details
        amount: parseFloat(amount),
        reference_number: reference,
        payment_date: paymentDate,
        description: description || `Quick deposit - ${pilgrimData.registration_id}`,
      };

      await api.post('/bank-payment-submissions/current_submission/', depositData);
      toast.success(`Deposit of ${amount} GMD recorded!`);
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to record deposit';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert type="success" message="Deposit recorded successfully! Redirecting..." />
    );
  }

  // Step 1: Lookup pilgrim
  if (step === 'lookup') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Find Pilgrim</h3>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLookup} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Pilgrim ID or Phone Number
              </label>
              <input
                type="text"
                value={pilgrimId || phone}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length <= 3 || /^\d+$/.test(val)) {
                    setPilgrimId(val);
                    setPhone('');
                  } else {
                    setPhone(val);
                    setPilgrimId('');
                  }
                }}
                placeholder="e.g., P001 or +220 3123456"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-base transition"
              />
              <p className="text-xs text-gray-500 mt-2">Enter pilgrim registration ID or phone number</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold disabled:opacity-50 transition"
              >
                {loading ? 'Searching...' : 'Find Pilgrim'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 2: Record deposit
  return (
    <div className="space-y-6">
      {/* Pilgrim Summary */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-emerald-900 mb-2">✓ Pilgrim Found</p>
        <p className="text-sm text-emerald-800">
          <strong>{pilgrimData.full_name}</strong> • {pilgrimData.registration_id}
        </p>
        <p className="text-xs text-emerald-700 mt-1">{pilgrimData.phone}</p>
        <button
          onClick={() => {
            setStep('lookup');
            setError('');
          }}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium mt-2"
        >
          ← Search different pilgrim
        </button>
      </div>

      {/* Deposit Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Record Quick Deposit</h3>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitDeposit} className="space-y-6">
          {/* Info: Pilgrim details auto-filled from lookup */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium">
              ✓ Pilgrim info auto-filled - enter deposit & payer details below
            </p>
          </div>

          {/* Payer Information */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
            <h4 className="text-base font-bold text-emerald-900 mb-4">Who is making this payment?</h4>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Payer Name *
                </label>
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Full name of person making deposit"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-base transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Payer Contact/ID
                </label>
                <input
                  type="text"
                  value={payerContact}
                  onChange={(e) => setPayerContact(e.target.value)}
                  placeholder="Phone, ID, or account number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-base transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Relationship to Pilgrim
                </label>
                <select
                  value={payerRelationship}
                  onChange={(e) => {
                    setPayerRelationship(e.target.value);
                    if (e.target.value !== 'Other') {
                      setOtherRelationship('');
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-base transition"
                >
                  <option value="Self">Self (Pilgrim themselves)</option>
                  <option value="Parent">Parent</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Other Family">Other Family</option>
                  <option value="Friend">Friend</option>
                  <option value="Employer">Employer</option>
                  <option value="Other">Other</option>
                </select>

                {payerRelationship === 'Other' && (
                  <input
                    type="text"
                    value={otherRelationship}
                    onChange={(e) => setOtherRelationship(e.target.value)}
                    placeholder="Please specify the relationship"
                    className="w-full px-4 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-base transition mt-3 bg-emerald-50"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Deposit Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Amount (GMD) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-lg font-bold transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Reference
              </label>
              <input
                type="text"
                value={reference}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none transition"
            />
          </div>

          {/* Deposit Preview */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-lg p-6 space-y-4">
            <h4 className="text-lg font-bold text-emerald-900 mb-4">📋 Deposit Summary</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <p className="text-xs text-gray-600 font-semibold">Pilgrim Name</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{pilgrimData.full_name}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <p className="text-xs text-gray-600 font-semibold">Registration ID</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{pilgrimData.registration_id}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <p className="text-xs text-gray-600 font-semibold">Payer Name</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{payerName}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <p className="text-xs text-gray-600 font-semibold">Relationship</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{payerRelationship}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-emerald-200 col-span-2">
                <p className="text-xs text-gray-600 font-semibold">Amount</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{amount} GMD</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <p className="text-xs text-gray-600 font-semibold">Payment Date</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{paymentDate}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <p className="text-xs text-gray-600 font-semibold">Reference</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{reference}</p>
              </div>
            </div>

            {description && (
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <p className="text-xs text-gray-600 font-semibold">Notes</p>
                <p className="text-sm text-gray-700 mt-1">{description}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStep('lookup')}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold disabled:opacity-50 transition"
            >
              {loading ? 'Submitting...' : 'Submit Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
