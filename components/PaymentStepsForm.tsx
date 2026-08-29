import { useState, ReactNode } from 'react';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import Button from './Common/Button';

interface Step {
  id: string;
  title: string;
  description: string;
}

interface PaymentStepsFormProps {
  steps: Step[];
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  children: ReactNode;
  formData: any;
  onInputChange: (e: any) => void;
  loading: boolean;
  error: string;
  isLastStep: boolean;
}

export default function PaymentStepsForm({
  steps,
  currentStep,
  onNext,
  onBack,
  children,
  formData,
  onInputChange,
  loading,
  error,
  isLastStep,
}: PaymentStepsFormProps) {
  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{step.title}</h2>
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4">{step.description}</p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Step Indicator Dots */}
      <div className="flex gap-2">
        {steps.map((s, idx) => (
          <div
            key={s.id}
            className={`flex-1 h-1 rounded-full transition-colors ${
              idx <= currentStep ? 'bg-emerald-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form Content */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        {children}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-between">
        <Button
          type="button"
          onClick={onBack}
          disabled={isFirstStep || loading}
          variant="secondary"
          className={isFirstStep ? 'opacity-50 cursor-not-allowed' : ''}
        >
          <BiChevronLeft size={16} className="mr-1" />
          Back
        </Button>

        {isLastStep ? (
          <Button type="submit" loading={loading} className="flex-1">
            Submit Payment
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={loading}
            className="flex-1"
          >
            Next
            <BiChevronRight size={16} className="ml-1" />
          </Button>
        )}
      </div>

      {/* Step Summary */}
      <div className="text-xs text-gray-500 text-center">
        {steps.map((s, idx) => (
          <span key={s.id}>
            {idx > 0 && ' • '}
            <span className={idx <= currentStep ? 'text-emerald-600 font-medium' : ''}>
              {s.title}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
