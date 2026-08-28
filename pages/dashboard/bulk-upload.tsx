import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Button from '@/components/Common/Button';
import Alert from '@/components/Common/Alert';
import Loading from '@/components/Common/Loading';
import { CSVUploadResult } from '@/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function BulkUploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [result, setResult] = useState<CSVUploadResult | null>(null);
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n').slice(0, 6);
      setPreview(lines);
    };
    reader.readAsText(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('csv_file', file);

      const response = await api.post('/bank-payment-submissions/bulk-upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data);
      toast.success(`Uploaded ${response.data.successful} payments successfully!`);

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to upload CSV';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-green-900 mb-4">Upload Complete!</h2>
            <p className="text-green-700 mb-6">
              Successfully uploaded <span className="font-bold">{result.successful}</span> payments
              {result.failed > 0 && ` with <span className="font-bold">${result.failed}</span> errors`}
            </p>

            {result.errors.length > 0 && (
              <div className="text-left bg-white p-4 rounded-lg mb-6 max-h-64 overflow-y-auto">
                <h3 className="font-semibold text-red-900 mb-2">Errors:</h3>
                {result.errors.map((err, idx) => (
                  <p key={idx} className="text-sm text-red-700">
                    Row {err.row}: {err.error}
                  </p>
                ))}
              </div>
            )}

            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Upload Payments</h1>
          <p className="text-gray-600 mt-1">Upload multiple pilgrim payments via CSV</p>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} />
        )}

        {/* Upload Form */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-4">
                Select CSV File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition">
                <div className="text-4xl mb-2">📤</div>
                <p className="text-gray-600 mb-2">Drag and drop your CSV file here, or click to select</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                  disabled={loading}
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition"
                >
                  Choose File
                </label>
                {file && (
                  <p className="text-sm text-green-600 mt-4">
                    ✓ {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            </div>

            {/* CSV Preview */}
            {preview.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">CSV Preview</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono text-gray-600 overflow-x-auto max-h-48 overflow-y-auto">
                  {preview.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Button
                type="submit"
                loading={loading}
                disabled={!file}
                className="flex-1"
              >
                Upload Payments
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

        {/* CSV Format Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4">CSV File Format</h3>
          <p className="text-sm text-blue-700 mb-4">Your CSV file must have these columns:</p>
          <div className="bg-white rounded p-4 text-sm font-mono text-gray-800 overflow-x-auto mb-4">
            <div>pilgrim_id,amount,reference_number,payment_date,description</div>
            <div className="text-gray-500 mt-2">Example:</div>
            <div>GH123456,5000,REF20240101ABC,2024-01-01,Payment from customer</div>
            <div>GH123457,3500,REF20240102DEF,2024-01-02,Partial payment</div>
          </div>
          <p className="text-xs text-blue-700">
            • Pilgrim ID: GHXXXXX format<br/>
            • Amount: Numeric value (no $ symbol)<br/>
            • Reference: Unique identifier<br/>
            • Payment Date: YYYY-MM-DD format<br/>
            • Description: Optional notes
          </p>
        </div>

        {/* Download Template */}
        <div className="text-center">
          <a
            href="data:text/csv;base64,cGlsZ3JpbV9pZCxhbW91bnQscmVmZXJlbmNlX251bWJlcixwYXltZW50X2RhdGUsZGVzY3JpcHRpb24KR0gxMjM0NTYsNTAwMCxSRUYyMDI0MDEwMUFCQywyMDI0LTAxLTAxLFBheW1lbnQgZnJvbSBjdXN0b21lcgpHSDEyMzQ1Nywz NTAwLFJFRjIwMjQwMTAyREVGLDIwMjQtMDEtMDIsUGFydGlhbCBwYXltZW50"
            download="payment-template.csv"
            className="inline-block px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition font-medium"
          >
            📥 Download CSV Template
          </a>
        </div>
      </div>
    </Layout>
  );
}
