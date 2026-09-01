import { BiX, BiPrinter } from 'react-icons/bi';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import { useState, useEffect, useRef, useCallback } from 'react';
import html2pdf from 'html2pdf.js';

// Print styles for professional receipt printing
const printStyles = `
  @media print {
    * {
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box;
    }

    body, html {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      width: 100% !important;
      height: 100% !important;
    }

    /* Hide everything by default */
    body > * {
      display: none !important;
    }

    /* Show only the receipt modal and its ancestors */
    .receipt-print-container {
      display: block !important;
      position: static !important;
      width: 100% !important;
      height: 100% !important;
      background: white !important;
    }

    .receipt-print-container > div {
      display: block !important;
      position: static !important;
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      max-height: none !important;
      background: white !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      overflow: visible !important;
      padding: 0.5in !important;
    }

    @page {
      margin: 0;
      size: A4;
    }
  }
`;

interface ReceiptData {
  pilgrim_first_name: string;
  pilgrim_last_name: string;
  pilgrim_phone: string;
  pilgrim_email: string;
  pilgrim_passport_number: string;
  pilgrim_date_of_birth: string;
  pilgrim_gender: 'M' | 'F';
  amount: number;
  reference_number: string;
  payment_date: string;
  registration_id?: string;
  payer_name: string;
  payer_relationship: string;
  payment_id?: number;
}

interface Signatory {
  id: number;
  signatory_name: string;
  signatory_title: string;
  digital_signature?: string;
  official_stamp?: string;
  stamp_color: string;
  email: string;
  phone: string;
  is_active: boolean;
}

interface GlobalSettings {
  bank_contact_email: string;
  bank_contact_phone: string;
}

interface ReceiptModalProps {
  data: ReceiptData;
  onClose: () => void;
  onReceiptSaved?: () => void;
  paymentId?: number;
}

export default function ReceiptModal({ data, onClose, onReceiptSaved }: ReceiptModalProps) {
  const [signatory, setSignatory] = useState<Signatory>({
    id: 0,
    signatory_name: 'GIA Bank Admin',
    signatory_title: 'Bank Administrator',
    stamp_color: '#16a34a',
    email: 'support@giabanking.gm',
    phone: '+220 XXX XXXX',
    is_active: false,
  });

  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    bank_contact_email: 'support@giabanking.gm',
    bank_contact_phone: '+220 XXX XXXX',
  });

  const [receiptSaved, setReceiptSaved] = useState(false);
  const [savingReceipt, setSavingReceipt] = useState(false);

  // Add print styles on mount
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = printStyles;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const fetchSignatorySettings = async () => {
    try {
      // Check if we have cached signatory
      const cachedSignatory = sessionStorage.getItem('cached_signatory');
      const cachedSettings = sessionStorage.getItem('cached_settings');

      if (cachedSignatory && cachedSettings) {
        console.log('Using cached signatory and settings');
        setSignatory(JSON.parse(cachedSignatory));
        setGlobalSettings(JSON.parse(cachedSettings));
        return;
      }

      // Fetch active signatory from GIA backend
      const signatoryResponse = await api.get('/signatories/');
      console.log('Signatories response:', signatoryResponse.data);

      if (signatoryResponse.data && Array.isArray(signatoryResponse.data)) {
        const activeSignatory = signatoryResponse.data.find((s: any) => s.is_active);
        const signatoryToUse = activeSignatory || signatoryResponse.data[0];

        if (signatoryToUse) {
          console.log('Signatory found:', signatoryToUse);
          setSignatory(signatoryToUse);
          // Cache for future use
          sessionStorage.setItem('cached_signatory', JSON.stringify(signatoryToUse));
        }
      }

      // Also fetch global settings
      const settingsResponse = await api.get('/settings/signatory/');
      if (settingsResponse.data) {
        console.log('Settings response:', settingsResponse.data);
        setGlobalSettings(settingsResponse.data);
        // Cache for future use
        sessionStorage.setItem('cached_settings', JSON.stringify(settingsResponse.data));
      }
    } catch (error) {
      console.error('Failed to load signatory settings:', error);
      // Use defaults if fetch fails
    }
  };

  const handleSaveReceiptWithSignatory = useCallback(async (signatoryData: Signatory) => {
    console.log('handleSaveReceiptWithSignatory called with signatory:', signatoryData);
    try {
      setSavingReceipt(true);
      const receiptNumber = `RCP${Date.now().toString().slice(-8)}`;
      console.log('About to save receipt with number:', receiptNumber);

      // Format date as YYYY-MM-DD
      const formatDateForBackend = (dateStr: any) => {
        if (!dateStr) return new Date().toISOString().split('T')[0];

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

      // Clean up data - convert 'N/A' to empty strings
      const cleanValue = (val: any) => {
        if (val === 'N/A' || !val) return '';
        return val;
      };

      const receiptPayload: any = {
        signatory: signatoryData.id && signatoryData.id > 0 ? signatoryData.id : null,
        receipt_number: receiptNumber,
        payment: data.payment_id || null,
        pilgrim_first_name: cleanValue(data.pilgrim_first_name) || 'Unknown',
        pilgrim_last_name: cleanValue(data.pilgrim_last_name) || 'Unknown',
        pilgrim_email: cleanValue(data.pilgrim_email),
        pilgrim_phone: cleanValue(data.pilgrim_phone),
        pilgrim_passport: cleanValue(data.pilgrim_passport_number),
        pilgrim_dob: cleanValue(data.pilgrim_date_of_birth) || null,
        pilgrim_gender: data.pilgrim_gender || 'M',
        payer_name: cleanValue(data.payer_name) || 'Unknown',
        payer_relationship: cleanValue(data.payer_relationship),
        amount: data.amount || 0,
        payment_date: formatDateForBackend(data.payment_date),
      };

      console.log('About to make API.POST call with payload:', receiptPayload);
      const response = await api.post('/receipts/', receiptPayload);
      console.log('API.POST returned:', response.data);
      setReceiptSaved(true);
      onReceiptSaved?.();
      console.log('Receipt saved successfully:', receiptNumber);

      // Generate and download PDF
      setTimeout(() => {
        generateAndDownloadPDF(receiptNumber);
      }, 500);

    } catch (error: any) {
      console.warn('Failed to save receipt:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);

      let errorMsg = 'Failed to save receipt';

      if (error.response?.status === 500) {
        errorMsg = 'Server error (500). Check backend logs.';
      } else if (typeof error.response?.data === 'string') {
        errorMsg = 'Server error: ' + error.response.data.substring(0, 200);
      } else if (error.response?.data?.detail) {
        errorMsg = error.response.data.detail;
      } else if (error.response?.data) {
        const errors = Object.values(error.response.data).flat();
        errorMsg = errors.join(', ') || error.message;
      } else {
        errorMsg = error.message || 'Failed to save receipt';
      }

      alert(`Failed to save receipt: ${errorMsg}`);
    } finally {
      setSavingReceipt(false);
    }
  }, [data]);

  const handleSaveReceipt = useCallback(async () => {
    console.log('handleSaveReceipt called with current signatory state');
    handleSaveReceiptWithSignatory(signatory);
  }, [signatory, handleSaveReceiptWithSignatory]);

  useEffect(() => {
    // Fetch signatory for display
    fetchSignatorySettings();
  }, []);

  useEffect(() => {
    // Use sessionStorage to track if we've already saved for this data combo
    const cacheKey = `receipt_saved_${data.reference_number}`;
    const alreadySaved = sessionStorage.getItem(cacheKey);

    console.log('ReceiptModal useEffect ran for ref:', data.reference_number, 'alreadySaved:', alreadySaved);

    if (alreadySaved) {
      console.log('Skipping - already saved this receipt');
      return;
    }

    console.log('Marking as saved and proceeding with save');
    sessionStorage.setItem(cacheKey, 'true');

    // Save receipt - backend will auto-fetch and assign active signatory
    (async () => {
      console.log('Saving receipt - backend will auto-assign active signatory');
      handleSaveReceipt();
    })();
  }, [data.reference_number, handleSaveReceipt]);

  const generateAndDownloadPDF = (receiptNumber: string) => {
    const element = document.querySelector('.receipt-print-container');
    if (!element) {
      console.error('Receipt container not found');
      return;
    }

    const opt = {
      margin: 10,
      filename: `Receipt_${receiptNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handlePrint = () => {
    window.print();
  };

  const registrationId = data.registration_id || `REF${Date.now().toString().slice(-8)}`;
  const currentTime = new Date();
  const receiptTime = currentTime.toLocaleTimeString('en-GM', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="receipt-print-container fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-none print:rounded-none print:shadow-none print:overflow-visible">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between print:hidden">
          <h2 className="text-xl font-bold text-gray-900">Payment Receipt</h2>
          <div className="flex items-center gap-2">
            {receiptSaved && (
              <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm flex items-center gap-2">
                <span>✓</span>
                <span>Receipt Saved</span>
              </div>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <BiPrinter size={18} />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <BiX size={20} />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-8 print:p-12 print:max-w-full print:m-0 print:bg-white">
          {/* Official Header with Stamp */}
          <div className="relative text-center mb-8 pb-6 border-b-2 border-gray-400">
            <h1 className="text-3xl font-bold text-gray-900">GIA Bank Portal</h1>
            <p className="text-gray-600 mt-1 font-semibold">Gambia International Airlines</p>
            <p className="text-sm text-gray-500 mt-1">Official Payment Receipt</p>

            {/* Official Stamp */}
            {signatory.official_stamp ? (
              <img
                src={signatory.official_stamp}
                alt="Official Stamp"
                className="absolute top-2 right-4 w-20 h-20 opacity-80 print:opacity-100 object-contain"
              />
            ) : (
              <svg
                className="absolute top-2 right-4 w-20 h-20 opacity-80 print:opacity-100"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                  </filter>
                </defs>
                <circle cx="50" cy="50" r="45" fill="none" stroke={signatory.stamp_color} strokeWidth="2" filter="url(#shadow)" opacity="0.6" strokeDasharray="3,2"/>
                <circle cx="50" cy="50" r="38" fill="none" stroke={signatory.stamp_color} strokeWidth="1" opacity="0.5"/>
                <text x="50" y="35" textAnchor="middle" fontSize="8" fontWeight="bold" fill={signatory.stamp_color} opacity="0.7">OFFICIAL</text>
                <text x="50" y="47" textAnchor="middle" fontSize="7" fill={signatory.stamp_color} opacity="0.7">RECEIPT</text>
                <text x="50" y="58" textAnchor="middle" fontSize="7" fill={signatory.stamp_color} opacity="0.7">VERIFIED</text>
              </svg>
            )}
          </div>

          {/* Receipt Reference Numbers */}
          <div className="grid grid-cols-3 gap-3 mb-8 pb-6 border-b-2 border-gray-300">
            <div className="bg-gray-50 p-3 rounded border border-gray-300">
              <p className="text-xs text-gray-600 font-semibold uppercase">Receipt Number</p>
              <p className="text-sm font-mono text-gray-900 mt-1 font-bold">{registrationId}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border border-gray-300">
              <p className="text-xs text-gray-600 font-semibold uppercase">Reference ID</p>
              <p className="text-sm font-mono text-gray-900 mt-1 font-bold">{data.reference_number}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border border-gray-300">
              <p className="text-xs text-gray-600 font-semibold uppercase">Date & Time</p>
              <p className="text-xs font-mono text-gray-900 mt-1">{currentTime.toLocaleDateString('en-GM')}</p>
              <p className="text-xs font-mono text-gray-900">{receiptTime}</p>
            </div>
          </div>

          {/* Pilgrim Information */}
          <div className="mb-8">
            <div className="bg-emerald-50 border-l-4 border-emerald-600 px-4 py-3 mb-4 rounded-r">
              <h3 className="text-sm font-bold text-emerald-900 uppercase">Pilgrim Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 p-3 rounded">
                <p className="text-xs text-gray-600 font-semibold uppercase">Full Name</p>
                <p className="text-sm text-gray-900 mt-1 font-medium">
                  {data.pilgrim_first_name} {data.pilgrim_last_name}
                </p>
              </div>
              <div className="border border-gray-200 p-3 rounded">
                <p className="text-xs text-gray-600 font-semibold uppercase">Gender</p>
                <p className="text-sm text-gray-900 mt-1">
                  {data.pilgrim_gender === 'M' ? 'Male (Alagie)' : 'Female (Aja)'}
                </p>
              </div>
              <div className="border border-gray-200 p-3 rounded">
                <p className="text-xs text-gray-600 font-semibold uppercase">Date of Birth</p>
                <p className="text-sm text-gray-900 mt-1">{data.pilgrim_date_of_birth}</p>
              </div>
              <div className="border border-gray-200 p-3 rounded">
                <p className="text-xs text-gray-600 font-semibold uppercase">Passport Number</p>
                <p className="text-sm text-gray-900 mt-1 font-mono">{data.pilgrim_passport_number}</p>
              </div>
              <div className="border border-gray-200 p-3 rounded">
                <p className="text-xs text-gray-600 font-semibold uppercase">Phone</p>
                <p className="text-sm text-gray-900 mt-1 font-mono">{data.pilgrim_phone}</p>
              </div>
              <div className="border border-gray-200 p-3 rounded">
                <p className="text-xs text-gray-600 font-semibold uppercase">Email</p>
                <p className="text-sm text-gray-900 mt-1 font-mono break-all text-xs">{data.pilgrim_email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Payer Information */}
          <div className="mb-8">
            <div className="bg-blue-50 border-l-4 border-blue-600 px-4 py-3 mb-4 rounded-r">
              <h3 className="text-sm font-bold text-blue-900 uppercase">Payer Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 p-3 rounded col-span-2 md:col-span-1">
                <p className="text-xs text-gray-600 font-semibold uppercase">Payer Name</p>
                <p className="text-sm text-gray-900 mt-1 font-medium">{data.payer_name}</p>
              </div>
              <div className="border border-gray-200 p-3 rounded col-span-2 md:col-span-1">
                <p className="text-xs text-gray-600 font-semibold uppercase">Relationship</p>
                <p className="text-sm text-gray-900 mt-1">{data.payer_relationship}</p>
              </div>
            </div>
          </div>

          {/* Payment Summary - Highlighted */}
          <div className="mb-8">
            <div className="bg-emerald-50 border-2 border-emerald-600 rounded-lg p-6">
              <h3 className="text-lg font-bold text-emerald-900 mb-4 uppercase">Payment Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b-2 border-emerald-300">
                  <span className="text-gray-700 font-medium">Amount Paid:</span>
                  <span className="text-3xl font-bold text-emerald-600">{formatCurrency(data.amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Payment Date:</span>
                  <span className="text-sm font-mono text-gray-900">{data.payment_date}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Digital Signature Section */}
          <div className="mb-8 pt-8 border-t-2 border-gray-300">
            <h3 className="text-sm font-bold text-gray-900 uppercase mb-6">Authorization & Digital Signature</h3>
            <div className="grid grid-cols-2 gap-8">
              {/* Authorized Officer */}
              <div className="text-center">
                <div className="h-16 border-b-2 border-gray-400 mb-2 flex items-center justify-center overflow-hidden">
                  {signatory.digital_signature ? (
                    <img
                      src={signatory.digital_signature}
                      alt="Digital Signature"
                      className="max-w-full max-h-16 object-contain"
                    />
                  ) : (
                    <svg className="w-12 h-12 text-gray-400" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
                      <path d="M 20 50 Q 50 20, 80 50" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                      <path d="M 30 55 L 70 60" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Authorized By</p>
                <p className="text-xs text-gray-500 mt-1">{signatory.signatory_name}</p>
                <p className="text-xs text-gray-500">{signatory.signatory_title}</p>
              </div>

              {/* Timestamp */}
              <div className="text-center">
                <div className="h-16 border-b-2 border-gray-400 mb-2 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 font-mono">{currentTime.toISOString().split('T')[0]}</p>
                    <p className="text-xs text-gray-600 font-mono">{receiptTime} GMT</p>
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Processing Time</p>
                <p className="text-xs text-gray-500 mt-1">Digital Timestamp</p>
              </div>
            </div>
          </div>

          {/* Security & Authenticity */}
          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mb-8">
            <p className="text-xs text-gray-600 font-semibold uppercase mb-2">Receipt Security Features</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p>✓ Digitally Signed Receipt</p>
              <p>✓ Official GIA Bank Portal Verification</p>
              <p>✓ Tamper-Proof Transaction Record</p>
              <p>✓ Automated System Generated</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-6 border-t-2 border-gray-400 mt-8">
            <p className="text-xs text-gray-600 font-semibold">OFFICIAL PAYMENT RECEIPT</p>
            <p className="text-xs text-gray-500 mt-2">This is an officially signed digital receipt from GIA Bank Portal</p>
            <p className="text-xs text-gray-500">For inquiries, contact: {globalSettings.bank_contact_email}</p>
            {globalSettings.bank_contact_phone && (
              <p className="text-xs text-gray-500">Phone: {globalSettings.bank_contact_phone}</p>
            )}
            <p className="text-xs text-gray-500 mt-3 print:block hidden">
              Document ID: {registrationId} | Generated: {currentTime.toLocaleString('en-GM')}
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .fixed {
            position: static;
            background: white;
          }
          .print\\:hidden {
            display: none;
          }
          .print\\:block {
            display: block;
          }
          .print\\:p-4 {
            padding: 1rem;
          }
          .print\\:opacity-100 {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
