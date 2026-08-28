export interface BankPaymentSubmission {
  id: string;
  bank: number;
  pilgrim_id: string;
  amount: number;
  reference_number: string;
  status: 'pending' | 'verified' | 'failed';
  submission_method: 'manual_form' | 'csv_upload' | 'api_webhook';
  payment_date: string;
  description: string;
  submitted_by_user: string;
  submitted_at: string;
  verified_at: string;
  error_message?: string;
}

export interface ManualPaymentData {
  pilgrim_id: string;
  amount: number;
  reference_number: string;
  payment_date: string;
  description?: string;
}

export interface CSVUploadResult {
  successful: number;
  failed: number;
  results: Array<{
    row: number;
    reference_number: string;
    status: string;
  }>;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

export interface BankStats {
  total_submissions: number;
  total_amount: string;
  verified_count: number;
  pending_count: number;
  failed_count: number;
}

export interface APIKey {
  key: string;
  secret: string;
  created_at: string;
  is_active: boolean;
}
