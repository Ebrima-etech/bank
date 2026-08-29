import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import PaymentStepsForm from '@/components/PaymentStepsForm';
import Alert from '@/components/Common/Alert';
import api from '@/lib/api';
import { generateReference } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PaymentFormData {
  pilgrim_first_name: string;
  pilgrim_last_name: string;
  pilgrim_gender: 'M' | 'F';
  pilgrim_phone: string;
  pilgrim_email: string;
  payer_name: string;
  payer_contact: string;
  payer_relationship: string;
  amount: number;
  reference_number: string;
  payment_date: string;
  description: string;
}

const formSteps = [
  {
    id: 'pilgrim-info',
    title: 'Pilgrim Information',
    description: 'Enter the pilgrim details for this payment',
  },
  {
    id: 'payer-info',
    title: 'Payer Information',
    description: 'Who is making this payment?',
  },
  {
    id: 'payment-details',
    title: 'Payment Details',
    description: 'Enter amount and payment information',
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Verify all details before submitting',
  },
];

export default function SubmitPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // When relationship changes to "Self", auto-fill payer info
    if (name === 'payer_relationship' && value === 'Self') {
      setFormData((prev) => ({
        ...prev,
        payer_relationship: value,
        payer_name: `${prev.pilgrim_first_name} ${prev.pilgrim_last_name}`,
        payer_contact: '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'amount' ? parseFloat(value) : value,
      }));
    }
  };

  const handleGenerateReference = () => {
    setFormData((prev) => ({
      ...prev,
      reference_number: generateReference(),
    }));
  };

  const handleNextStep = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Submit Payment</h1>
          <p className="text-gray-600 mt-1">Step-by-step payment submission</p>
        </div>

        {success && (
          <Alert type="success" message="Payment submitted successfully! Redirecting..." />
        )}

        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
          <form onSubmit={handleSubmit}>
            <PaymentStepsForm
              steps={formSteps}
              currentStep={currentStep}
              onNext={handleNextStep}
              onBack={handleBackStep}
              formData={formData}
              onInputChange={handleInputChange}
              loading={loading}
              error={error}
              isLastStep={currentStep === formSteps.length - 1}
            >
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="pilgrim_first_name"
                        value={formData.pilgrim_first_name}
                        onChange={handleInputChange}
                        placeholder="e.g., Hassan"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="pilgrim_last_name"
                        value={formData.pilgrim_last_name}
                        onChange={handleInputChange}
                        placeholder="e.g., Jallow"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Gender *
                      </label>
                      <select
                        name="pilgrim_gender"
                        value={formData.pilgrim_gender}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer"
                      >
                        <option value="M">Alagie (Male)</option>
                        <option value="F">Aja (Female)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        name="pilgrim_phone"
                        value={formData.pilgrim_phone}
                        onChange={handleInputChange}
                        placeholder="e.g., +220 3123456"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="pilgrim_email"
                      value={formData.pilgrim_email}
                      onChange={handleInputChange}
                      placeholder="e.g., hassan@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  {formData.payer_relationship === 'Self' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-emerald-800">
                        ✓ <strong>Auto-filled:</strong> Payer information is automatically filled with pilgrim details for Self payments.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Payer Name *
                    </label>
                    <input
                      type="text"
                      name="payer_name"
                      value={formData.payer_name}
                      onChange={handleInputChange}
                      placeholder="Full name of person making deposit"
                      disabled={formData.payer_relationship === 'Self'}
                      readOnly={formData.payer_relationship === 'Self'}
                      required
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
                        formData.payer_relationship === 'Self' ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Payer Contact/ID
                    </label>
                    <input
                      type="text"
                      name="payer_contact"
                      value={formData.payer_contact}
                      onChange={handleInputChange}
                      placeholder="Phone, ID, or account number"
                      disabled={formData.payer_relationship === 'Self'}
                      readOnly={formData.payer_relationship === 'Self'}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
                        formData.payer_relationship === 'Self' ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Relationship to Pilgrim
                      {formData.payer_relationship === 'Self' && (
                        <span className="ml-2 text-xs font-normal text-emerald-600">✓ Auto-filled as Self</span>
                      )}
                    </label>
                    <select
                      name="payer_relationship"
                      value={formData.payer_relationship}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer"
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
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Amount (GMD) *
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
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateReference}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
                      >
                        Generate
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Auto-generated unique reference</p>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-6">
                    Please review all details below. Once submitted, this payment will be recorded in the system.
                  </p>

                  {/* Pilgrim Information Review */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Pilgrim Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Full Name</p>
                        <p className="font-medium text-gray-900">
                          {formData.pilgrim_first_name} {formData.pilgrim_last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Gender</p>
                        <p className="font-medium text-gray-900">
                          {formData.pilgrim_gender === 'M' ? 'Alagie (Male)' : 'Aja (Female)'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{formData.pilgrim_phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">
                          {formData.pilgrim_email || '(Not provided)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payer Information Review */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Payer Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="col-span-2">
                        <p className="text-gray-600">Payer Name</p>
                        <p className="font-medium text-gray-900">{formData.payer_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Contact/ID</p>
                        <p className="font-medium text-gray-900">
                          {formData.payer_contact || '(Not provided)'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Relationship</p>
                        <p className="font-medium text-gray-900">{formData.payer_relationship}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details Review */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Payment Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Amount</p>
                        <p className="font-mono font-bold text-emerald-700 text-lg">
                          {formData.amount} GMD
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Payment Date</p>
                        <p className="font-medium text-gray-900">{formData.payment_date}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600">Reference Number</p>
                        <p className="font-mono font-medium text-gray-900">{formData.reference_number}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Any additional notes about this payment..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Final Confirmation */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-900">
                      <strong>⚠️ Confirmation:</strong> By clicking Submit Payment, you confirm that all information above is accurate and complete.
                    </p>
                  </div>
                </div>
              )}
            </PaymentStepsForm>
          </form>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-900 mb-2">💡 Important:</p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• All pilgrim information will be recorded with this payment</li>
            <li>• Payer information helps track the payment source</li>
            <li>• Reference number must be unique for each transaction</li>
            <li>• All amounts are in Gambian Dalasi (GMD)</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
