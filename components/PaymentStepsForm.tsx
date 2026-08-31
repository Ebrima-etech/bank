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
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{step.title}</h2>
          <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <p className="text-base text-gray-600">{step.description}</p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
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
            className={`flex-1 h-2 rounded-full transition-all duration-300 ${
              idx <= currentStep ? 'bg-emerald-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Form Content */}
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
        {children}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-between pt-4">
        <Button
          type="button"
          onClick={onBack}
          disabled={isFirstStep || loading}
          variant="secondary"
          className={`px-6 py-3 font-semibold ${isFirstStep ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <BiChevronLeft size={18} className="mr-2" />
          Back
        </Button>

        {isLastStep ? (
          <Button type="submit" loading={loading} className="flex-1 px-6 py-3 font-semibold">
            ✓ Submit Payment
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={loading}
            className="flex-1 px-6 py-3 font-semibold"
          >
            Next
            <BiChevronRight size={18} className="ml-2" />
          </Button>
        )}
      </div>

      {/* Step Summary */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
        {steps.map((s, idx) => (
          <span key={s.id}>
            {idx > 0 && ' • '}
            <span className={idx <= currentStep ? 'text-emerald-600 font-semibold' : ''}>
              {s.title}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
