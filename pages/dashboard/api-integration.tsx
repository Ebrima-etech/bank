import { useState } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Common/Button';

export default function APIIntegrationPage() {
  const [copied, setCopied] = useState('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const apiEndpoint = 'POST http://localhost:8000/api/v1/banks/payment-submissions/manual-submission/';

  const curlExample = `curl -X POST http://localhost:8000/api/v1/banks/payment-submissions/manual-submission/ \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "pilgrim_id": "GH123456",
    "amount": 5000,
    "reference_number": "REF20240101ABC",
    "payment_date": "2024-01-01",
    "description": "Payment from customer"
  }'`;

  const pythonExample = `import requests

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

data = {
    "pilgrim_id": "GH123456",
    "amount": 5000,
    "reference_number": "REF20240101ABC",
    "payment_date": "2024-01-01",
    "description": "Payment from customer"
}

response = requests.post(
    "http://localhost:8000/api/v1/banks/payment-submissions/manual-submission/",
    headers=headers,
    json=data
)`;

  const jsExample = `const axios = require('axios');

const config = {
  headers: {
    Authorization: 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
};

const data = {
  pilgrim_id: 'GH123456',
  amount: 5000,
  reference_number: 'REF20240101ABC',
  payment_date: '2024-01-01',
  description: 'Payment from customer'
};

axios.post(
  'http://localhost:8000/api/v1/banks/payment-submissions/manual-submission/',
  data,
  config
).then(response => console.log(response.data));`;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Integration</h1>
          <p className="text-gray-600 mt-1">Integrate GIA payment system with your banking infrastructure</p>
        </div>

        {/* Authentication Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔐 Authentication</h2>
          <p className="text-gray-600 mb-4">All API requests require JWT authentication:</p>
          <div className="bg-gray-50 rounded p-4 text-sm mb-4">
            <code className="text-gray-800">Authorization: Bearer YOUR_JWT_TOKEN</code>
          </div>
          <p className="text-sm text-gray-600">
            Login with your bank credentials to receive a JWT token. Include this token in the Authorization header for all requests.
          </p>
        </div>

        {/* API Endpoint */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📡 API Endpoint</h2>
          <div className="bg-blue-50 rounded p-4 mb-4 flex items-center justify-between">
            <code className="text-sm text-blue-900">{apiEndpoint}</code>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => copyToClipboard(apiEndpoint, 'endpoint')}
            >
              {copied === 'endpoint' ? '✓ Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Request Body */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📝 Request Body</h2>
          <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto text-gray-800">
{`{
  "pilgrim_id": "GH123456",      // Required: Pilgrim ID in GHXXXXX format
  "amount": 5000,                 // Required: Payment amount in USD
  "reference_number": "REF...",   // Required: Unique reference
  "payment_date": "2024-01-01",   // Required: YYYY-MM-DD format
  "description": "Optional"       // Optional: Payment notes
}`}
          </pre>
        </div>

        {/* Code Examples */}
        <div className="space-y-4">
          {/* cURL */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">cURL Example</h3>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyToClipboard(curlExample, 'curl')}
              >
                {copied === 'curl' ? '✓ Copied' : 'Copy'}
              </Button>
            </div>
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto text-gray-800 font-mono">
              {curlExample}
            </pre>
          </div>

          {/* Python */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Python Example</h3>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyToClipboard(pythonExample, 'python')}
              >
                {copied === 'python' ? '✓ Copied' : 'Copy'}
              </Button>
            </div>
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto text-gray-800 font-mono">
              {pythonExample}
            </pre>
          </div>

          {/* JavaScript */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">JavaScript/Node.js Example</h3>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyToClipboard(jsExample, 'js')}
              >
                {copied === 'js' ? '✓ Copied' : 'Copy'}
              </Button>
            </div>
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto text-gray-800 font-mono">
              {jsExample}
            </pre>
          </div>
        </div>

        {/* Error Responses */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">⚠️ Error Responses</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-gray-900">400 - Bad Request</p>
              <p className="text-gray-600">Missing or invalid required fields</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">401 - Unauthorized</p>
              <p className="text-gray-600">Invalid or missing authentication token</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">404 - Not Found</p>
              <p className="text-gray-600">Pilgrim with given ID does not exist</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">500 - Server Error</p>
              <p className="text-gray-600">Server-side error, please try again later</p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-2">📞 Need Help?</h3>
          <p className="text-sm text-green-700">
            For technical support or integration assistance, contact GIA operations team or refer to our API documentation.
          </p>
        </div>
      </div>
    </Layout>
  );
}
