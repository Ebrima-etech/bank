import { BiX } from 'react-icons/bi';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  bank_name?: string;
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
  const hasInitiatedSaveRef = useRef(false);

  const [signatoryLoaded, setSignatoryLoaded] = useState(false);
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
      console.log('Fetching signatories...');
      // Fetch active signatory from GIA backend
      const signatoryResponse = await api.get('/signatories/');
      console.log('Signatories response status:', signatoryResponse.status);
      console.log('Signatories response data:', signatoryResponse.data);

      if (signatoryResponse.data && Array.isArray(signatoryResponse.data)) {
        console.log('Signatories count:', signatoryResponse.data.length);

        if (signatoryResponse.data.length > 0) {
          const activeSignatory = signatoryResponse.data.find((s: any) => s.is_active);
          const signatoryToUse = activeSignatory || signatoryResponse.data[0];

          console.log('Active signatory found:', activeSignatory?.signatory_name);
          console.log('Using signatory:', signatoryToUse.signatory_name);

          if (signatoryToUse && signatoryToUse.id > 0) {
            console.log('Setting signatory state:', signatoryToUse);
            setSignatory(signatoryToUse);
          } else {
            console.warn('Signatory id is invalid:', signatoryToUse?.id);
          }
        } else {
          console.warn('No signatories returned from API');
        }
      } else {
        console.warn('Signatories response is not an array:', typeof signatoryResponse.data);
      }

      // Also fetch global settings
      try {
        console.log('Fetching global settings...');
        const settingsResponse = await api.get('/settings/signatory/');
        if (settingsResponse.data) {
          console.log('Settings response:', settingsResponse.data);
          setGlobalSettings(settingsResponse.data);
        }
      } catch (settingsError) {
        console.warn('Failed to load settings:', settingsError);
      }

      // Mark signatory as loaded
      setSignatoryLoaded(true);
    } catch (error) {
      console.error('Failed to load signatory settings - detailed error:', {
        message: error instanceof Error ? error.message : String(error),
        error: error,
      });
      // Still mark as loaded even if there's an error
      setSignatoryLoaded(true);
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
        receipt_number: receiptNumber,
        payment_reference: data.reference_number || '',
        signatory: signatoryData.id && signatoryData.id > 0 ? signatoryData.id : null,
      };

      console.log('About to make API.POST call with payload:', receiptPayload);
      const response = await api.post('/receipts/', receiptPayload);
      console.log('API.POST returned:', response.data);

      // Update signatory display with data from response
      if (response.data.signatory_name) {
        setSignatory({
          ...signatory,
          signatory_name: response.data.signatory_name,
          signatory_title: response.data.signatory_title || signatory.signatory_title,
        });
        console.log('Updated signatory display:', response.data.signatory_name);
      }

      setReceiptSaved(true);
      onReceiptSaved?.();
      console.log('Receipt saved successfully:', receiptNumber);

      // Generate and open PDF in new tab immediately
      console.log('Generating PDF...');
      try {
        await generateAndOpenPDF(receiptNumber, signatoryData);
        console.log('PDF generated, closing modal');
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
      }

      // Close modal after PDF generation completes
      setTimeout(() => {
        onClose();
      }, 2000);

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

  const handleSaveReceipt = () => {
    console.log('handleSaveReceipt called with current signatory state');
    handleSaveReceiptWithSignatory(signatory);
  };

  useEffect(() => {
    // Fetch signatory for display
    console.log('ReceiptModal mounted, fetching signatory settings...');
    fetchSignatorySettings().catch(err => {
      console.error('Error in fetchSignatorySettings:', err);
    });
  }, []);

  useEffect(() => {
    // Only initiate save once per modal instance
    if (hasInitiatedSaveRef.current) {
      console.log('Save already initiated, skipping');
      return;
    }

    // Only save after signatory is loaded
    if (!signatoryLoaded) {
      console.log('Waiting for signatory to load before saving...');
      return;
    }

    console.log('ReceiptModal useEffect - starting save for ref:', data.reference_number);
    hasInitiatedSaveRef.current = true;

    // Save receipt - backend will auto-fetch and assign active signatory
    handleSaveReceipt();
  }, [signatoryLoaded, data.reference_number]);

  const generateAndOpenPDF = useCallback(async (receiptNumber: string, signatoryData?: Signatory) => {
    try {
      const sigToUse = signatoryData || signatory;

      // Check if signatory has been loaded
      if (!sigToUse || !sigToUse.signatory_name || sigToUse.signatory_name === 'GIA Bank Admin') {
        console.log('Signatory not yet loaded, waiting...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return generateAndOpenPDF(receiptNumber, sigToUse);
      }

      console.log('Signatory loaded:', sigToUse.signatory_name);
      console.log('Waiting 200ms for all elements to render...');
      await new Promise(resolve => setTimeout(resolve, 200));

      console.log('Starting PDF generation for receipt:', receiptNumber);

      // Wait for container to be available
      let container: HTMLElement | null = null;
      let attempts = 0;
      while (!container && attempts < 10) {
        container = document.querySelector('.receipt-print-container > div') as HTMLElement;
        if (!container) {
          console.log('Container not found yet, waiting...');
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
      }

      if (!container) {
        console.error('Receipt element not found after retries');
        return;
      }

      console.log('Container found, generating PDF...');

      console.log('Container found, waiting for images to load...');

      // Wait for all images to load
      const images = container.querySelectorAll('img');
      console.log('Found', images.length, 'images to load');

      const imageLoadPromises = Array.from(images).map(img => {
        return new Promise(resolve => {
          if (img.complete) {
            console.log('Image already loaded:', img.src);
            resolve(null);
          } else {
            img.onload = () => {
              console.log('Image loaded:', img.src);
              resolve(null);
            };
            img.onerror = () => {
              console.warn('Image failed to load:', img.src);
              resolve(null);
            };
            setTimeout(() => resolve(null), 3000);
          }
        });
      });

      await Promise.all(imageLoadPromises);
      console.log('All images loaded, capturing...');

      console.log('Converting to canvas with html2canvas...');
      const canvas = await html2canvas(container, {
        scale: 1.2,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        useCORS: true,
        imageTimeout: 10000,
        windowHeight: container.scrollHeight,
        windowWidth: container.scrollWidth,
      });

      console.log('Canvas created, size:', canvas.width, 'x', canvas.height);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let finalWidth = imgWidth;
      let finalHeight = imgHeight;

      if (imgHeight > pageHeight - 20) {
        const scaleFactor = (pageHeight - 20) / imgHeight;
        finalWidth = imgWidth * scaleFactor;
        finalHeight = pageHeight - 20;
      }

      console.log('Adding image to PDF...');
      pdf.addImage(imgData, 'PNG', 10, 10, finalWidth, finalHeight);
      console.log('Image added successfully');

      console.log('Creating PDF blob...');
      const pdfBlob = pdf.output('blob');
      console.log('PDF blob created:', pdfBlob.size, 'bytes');

      console.log('Creating object URL...');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      console.log('PDF URL created:', pdfUrl);

      console.log('Waiting 100ms before opening in new tab...');
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('Opening new window...');
      const newWindow = window.open(pdfUrl, '_blank');
      console.log('Window open result:', newWindow);

      if (!newWindow) {
        console.error('Failed to open new window - popup blocked');
      } else {
        console.log('PDF opened successfully');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('Error details:', error);
    }
  }, [signatory]);


  const registrationId = data.registration_id || `REF${Date.now().toString().slice(-8)}`;
  const currentTime = new Date();
  const receiptTime = currentTime.toLocaleTimeString('en-GM', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Show loading screen while signatory is loading
  if (!signatoryLoaded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-gray-700 font-medium">Preparing receipt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="receipt-print-container fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-none print:rounded-none print:shadow-none print:overflow-visible">
        {/* Receipt Content */}
        <div className="p-3 print:p-2 print:max-w-full print:m-0 print:bg-white" style={{ maxWidth: '400px', margin: '0 auto' }}>
          {/* Header */}
          <div className="text-center mb-2 pb-2 border-b border-gray-300">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{data.bank_name || 'PAYMENT RECEIPT'}</h1>
            <p className="text-xs text-gray-600">Gambia International Airlines</p>
            <p className="text-xs text-gray-500 leading-tight">PAYMENT RECEIPT</p>
          </div>

          {/* Receipt Details */}
          <div className="mb-2 pb-2 border-b border-gray-300 text-xs space-y-0.5">
            <div className="flex justify-between">
              <span className="text-gray-600">Receipt #:</span>
              <span className="font-mono font-semibold text-xs">{registrationId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reference #:</span>
              <span className="font-mono font-semibold text-xs">{data.reference_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date & Time:</span>
              <span className="font-mono text-xs">{currentTime.toLocaleDateString('en-GM')} {receiptTime}</span>
            </div>
          </div>

          {/* Pilgrim Information */}
          <div className="mb-2 pb-2 border-b border-gray-300">
            <p className="text-xs font-semibold text-gray-700 uppercase mb-1">PILGRIM</p>
            <div className="text-xs space-y-0.5">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="text-xs">{data.pilgrim_first_name} {data.pilgrim_last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gender:</span>
                <span className="text-xs">{data.pilgrim_gender === 'M' ? 'M' : 'F'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Passport:</span>
                <span className="font-mono text-xs">{data.pilgrim_passport_number || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Payer Information */}
          <div className="mb-2 pb-2 border-b border-gray-300">
            <p className="text-xs font-semibold text-gray-700 uppercase mb-1">PAYER</p>
            <div className="text-xs space-y-0.5">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="text-xs">{data.payer_name}</span>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="mb-2 pb-2 border-b border-gray-300">
            <div className="text-center">
              <p className="text-xs text-gray-600 font-semibold">AMOUNT PAID</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(data.amount)}</p>
              <p className="text-xs text-gray-600">{data.payment_date}</p>
            </div>
          </div>

          {/* Signature Section */}
          <div className="mb-2 pb-2 border-b border-gray-300">
            <p className="text-xs font-semibold text-gray-700 uppercase mb-1">AUTHORIZATION</p>

            {/* Signature */}
            {signatory.digital_signature && (
              <div className="mb-1 text-center">
                <img
                  src={signatory.digital_signature}
                  alt="Digital Signature"
                  className="h-8 object-contain mx-auto"
                />
              </div>
            )}

            {/* Signatory Details */}
            <div className="text-xs space-y-0.5 mb-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Signatory:</span>
                <span className="font-semibold text-xs">{signatory.signatory_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Title:</span>
                <span className="text-xs">{signatory.signatory_title}</span>
              </div>
            </div>

            {/* Timestamp */}
            <div className="text-center border-t border-gray-300 pt-1">
              <p className="text-xs text-gray-600">{currentTime.toLocaleDateString('en-GM')} {receiptTime}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-600">
            <p className="font-semibold">OFFICIAL RECEIPT</p>
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
