import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import PaymentStepsForm from '@/components/PaymentStepsForm';
import CurrentDepositForm from '@/components/CurrentDepositForm';
import Alert from '@/components/Common/Alert';
import { PaymentFormSkeleton, DashboardSkeleton } from '@/components/Common/Skeleton';
import api from '@/lib/api';
import { generateReference } from '@/lib/utils';
import toast from 'react-hot-toast';
import { BiUserPlus, BiCreditCard, BiX, BiChevronLeft } from 'react-icons/bi';

interface PaymentFormData {
  pilgrim_first_name: string;
  pilgrim_last_name: string;
  pilgrim_gender: 'M' | 'F';
  pilgrim_phone: string;
  pilgrim_whatsapp: string;
  pilgrim_email: string;
  pilgrim_date_of_birth: string;
  pilgrim_nationality: string;
  pilgrim_region: string;
  pilgrim_passport_number: string;
  pilgrim_address: string;
  pilgrim_city: string;
  pilgrim_state: string;
  pilgrim_postal_code: string;
  pilgrim_country: string;
  second_contact_name: string;
  second_contact_phone: string;
  second_contact_whatsapp: string;
  second_contact_relationship: string;
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
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Enter pilgrim name, contact, and personal details',
  },
  {
    id: 'document-location',
    title: 'Document & Location',
    description: 'Passport, address, and region information',
  },
  {
    id: 'second-contact',
    title: 'Second Contact',
    description: 'Backup contact person information',
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

const GAMBIAN_REGIONS = [
  'Banjul (Capital Municipality)',
  'Kanifing (Municipality)',
  'West Coast Region',
  'North Bank Region',
  'Lower River Region',
  'Central River Region',
  'Upper River Region',
];

export default function SubmitPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [depositType, setDepositType] = useState<'first' | 'current' | null>(null);
  const [formData, setFormData] = useState<PaymentFormData>({
    pilgrim_first_name: '',
    pilgrim_last_name: '',
    pilgrim_gender: 'M',
    pilgrim_phone: '',
    pilgrim_whatsapp: '',
    pilgrim_email: '',
    pilgrim_date_of_birth: '',
    pilgrim_nationality: 'Gambian',
    pilgrim_region: '',
    pilgrim_passport_number: '',
    pilgrim_address: '',
    pilgrim_city: '',
    pilgrim_state: '',
    pilgrim_postal_code: '',
    pilgrim_country: 'Gambia',
    second_contact_name: '',
    second_contact_phone: '',
    second_contact_whatsapp: '',
    second_contact_relationship: '',
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

    // Prevent Enter key from submitting form
    if (e instanceof KeyboardEvent && e.key === 'Enter' && name !== 'description') {
      e.preventDefault();
      return;
    }

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    // Only allow Enter in textarea for description
    if (e.key === 'Enter' && target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  // Auto-fill payer info when "Self" is selected
  useEffect(() => {
    if (formData.payer_relationship === 'Self' && formData.pilgrim_first_name && formData.pilgrim_last_name) {
      setFormData((prev) => ({
        ...prev,
        payer_name: `${prev.pilgrim_first_name} ${prev.pilgrim_last_name}`,
        payer_contact: '',
      }));
    }
  }, [formData.payer_relationship]);

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

    // Only allow submission from the final review step
    if (currentStep !== formSteps.length - 1) {
      return;
    }

    setError('');

    // Validation
    if (!formData.pilgrim_first_name.trim() || !formData.pilgrim_last_name.trim()) {
      setError('Pilgrim first and last name are required');
      return;
    }
    if (!formData.pilgrim_date_of_birth) {
      setError('Date of birth is required');
      return;
    }
    if (!formData.pilgrim_nationality.trim()) {
      setError('Nationality is required');
      return;
    }
    if (!formData.pilgrim_passport_number.trim()) {
      setError('Passport number is required');
      return;
    }
    if (!formData.pilgrim_address.trim()) {
      setError('Address is required');
      return;
    }
    if (!formData.pilgrim_country.trim()) {
      setError('Country is required');
      return;
    }
    // For "Self", payer_name is auto-filled; for others, it's required
    if (formData.payer_relationship !== 'Self' && !formData.payer_name.trim()) {
      setError('Payer name is required');
      return;
    }
    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      // Ensure payer_name is filled for "Self"
      const submissionData = { ...formData };
      if (submissionData.payer_relationship === 'Self') {
        submissionData.payer_name = `${submissionData.pilgrim_first_name} ${submissionData.pilgrim_last_name}`;
      }

      console.log('Submitting payment data:', submissionData);

      const response = await api.post('/bank-payment-submissions/manual_submission/', submissionData);
      console.log('Submission response:', response.data);

      toast.success('Payment submitted successfully!');
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Submission error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);

      const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to submit payment';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Show deposit type selector if not yet chosen
  if (!depositType) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12 px-4 min-h-[calc(100vh-200px)]">
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-8 max-w-2xl w-full">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">💳 Submit Payment</h1>
              <p className="text-gray-600">Select the type of deposit you want to process</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* First Deposit Option */}
              <button
                onClick={() => setDepositType('first')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <BiUserPlus size={24} className="text-emerald-600 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">First Deposit</h3>
                    <p className="text-xs text-emerald-600 font-medium">New pilgrim</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 ml-9">Register a new pilgrim and record their payment</p>
                <p className="text-xs text-emerald-600 mt-3 ml-9 font-medium">Fill in full details</p>
              </button>

              {/* Current Deposit Option */}
              <button
                onClick={() => setDepositType('current')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <BiCreditCard size={24} className="text-emerald-600 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Current Deposit</h3>
                    <p className="text-xs text-emerald-600 font-medium">Existing pilgrim</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 ml-9">Record an additional payment for existing pilgrim</p>
                <p className="text-xs text-emerald-600 mt-3 ml-9 font-medium">Quick lookup</p>
              </button>
            </div>

            {/* Back Button */}
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 text-base font-semibold rounded-lg border border-gray-300 transition-all flex items-center justify-center gap-2 hover:border-gray-400"
            >
              <BiChevronLeft size={18} />
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Show loading skeleton during submission
  if (loading && currentStep === formSteps.length - 1) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-2 mb-8">
            <div className="h-8 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-60 animate-pulse"></div>
          </div>
          <PaymentFormSkeleton />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {depositType === 'first' ? (
              <BiUserPlus size={32} className="text-emerald-600" />
            ) : (
              <BiCreditCard size={32} className="text-emerald-600" />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {depositType === 'first' ? 'First Deposit' : 'Current Deposit'}
              </h1>
              <p className="text-gray-600 mt-1">
                {depositType === 'first'
                  ? 'Register new pilgrim and record payment'
                  : 'Quick deposit for existing pilgrim'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDepositType(null)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Change deposit type"
            disabled={loading}
          >
            <BiX size={20} />
          </button>
        </div>

        {success && (
          <Alert type="success" message="Payment submitted successfully! Redirecting..." />
        )}

        {/* Form - Show based on deposit type */}
        {depositType === 'current' ? (
          <CurrentDepositForm onBack={() => setDepositType(null)} />
        ) : (
          <div className="space-y-6">
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
              {/* Step 0: Basic Information */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>
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
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., Hassan"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
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
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., Jallow"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        name="pilgrim_date_of_birth"
                        value={formData.pilgrim_date_of_birth}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Gender *
                      </label>
                      <select
                        name="pilgrim_gender"
                        value={formData.pilgrim_gender}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer transition-all bg-white"
                      >
                        <option value="M">Alagie (Male)</option>
                        <option value="F">Aja (Female)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        name="pilgrim_phone"
                        value={formData.pilgrim_phone}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., +220 3123456"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        WhatsApp
                      </label>
                      <input
                        type="tel"
                        name="pilgrim_whatsapp"
                        value={formData.pilgrim_whatsapp}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., +220 3123456"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
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
                      onKeyDown={handleKeyDown}
                      placeholder="e.g., hassan@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                </div>
              )}

              {/* Step 1: Document & Location */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Passport Number *
                      </label>
                      <input
                        type="text"
                        name="pilgrim_passport_number"
                        value={formData.pilgrim_passport_number}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., GM123456"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Nationality *
                      </label>
                      <input
                        type="text"
                        name="pilgrim_nationality"
                        value={formData.pilgrim_nationality}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., Gambian"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      name="pilgrim_address"
                      value={formData.pilgrim_address}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Street address"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Region
                    </label>
                    <select
                      name="pilgrim_region"
                      value={formData.pilgrim_region}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer bg-white transition-all"
                    >
                      <option value="">Select a region</option>
                      {GAMBIAN_REGIONS.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      name="pilgrim_country"
                      value={formData.pilgrim_country}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g., Gambia"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Second Contact */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-emerald-800">
                      <strong>Backup Contact:</strong> Provide a secondary contact person in case the main pilgrim cannot be reached.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        name="second_contact_name"
                        value={formData.second_contact_name}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Full name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Relationship to Pilgrim
                      </label>
                      <input
                        type="text"
                        name="second_contact_relationship"
                        value={formData.second_contact_relationship}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., Parent, Sibling, Spouse"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="second_contact_phone"
                        value={formData.second_contact_phone}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., +220 3123456"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        name="second_contact_whatsapp"
                        value={formData.second_contact_whatsapp}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., +220 3123456"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-800">
                      💡 <strong>Tip:</strong> You can skip this if the backup contact info is not available yet. It can be added later.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Payer Information */}
              {currentStep === 3 && (
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
                      onKeyDown={handleKeyDown}
                      placeholder="Full name of person making deposit"
                      disabled={formData.payer_relationship === 'Self'}
                      readOnly={formData.payer_relationship === 'Self'}
                      required
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
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
                      onKeyDown={handleKeyDown}
                      placeholder="Phone, ID, or account number"
                      disabled={formData.payer_relationship === 'Self'}
                      readOnly={formData.payer_relationship === 'Self'}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer bg-white transition-all"
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

              {/* Step 4: Payment Details */}
              {currentStep === 4 && (
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
                      onKeyDown={handleKeyDown}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
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
                      onKeyDown={handleKeyDown}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
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

              {/* Step 5: Review & Submit */}
              {currentStep === 5 && (
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
                        <p className="text-gray-600">WhatsApp</p>
                        <p className="font-medium text-gray-900">
                          {formData.pilgrim_whatsapp || '(Not provided)'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">
                          {formData.pilgrim_email || '(Not provided)'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Region</p>
                        <p className="font-medium text-gray-900">
                          {formData.pilgrim_region || '(Not provided)'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600">Address</p>
                        <p className="font-medium text-gray-900">{formData.pilgrim_address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Second Contact Information Review */}
                  {(formData.second_contact_name || formData.second_contact_phone || formData.second_contact_whatsapp) && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Second Contact (Backup)</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Name</p>
                          <p className="font-medium text-gray-900">
                            {formData.second_contact_name || '(Not provided)'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Relationship</p>
                          <p className="font-medium text-gray-900">
                            {formData.second_contact_relationship || '(Not provided)'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Phone</p>
                          <p className="font-medium text-gray-900">
                            {formData.second_contact_phone || '(Not provided)'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">WhatsApp</p>
                          <p className="font-medium text-gray-900">
                            {formData.second_contact_whatsapp || '(Not provided)'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

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
                      onKeyDown={handleKeyDown}
                      placeholder="Any additional notes about this payment..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none transition-all"
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
        )}
      </div>
    </Layout>
  );
}
