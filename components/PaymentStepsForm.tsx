import { useState, ReactNode } from 'react';
import { BiChevronLeft, BiChevronRight, BiCheck } from 'react-icons/bi';
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
      {/* Step Indicators with Numbers and Checkmarks */}
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-2">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex flex-col items-center flex-1">
              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute top-6 left-0 right-0 h-1 mx-auto transition-all duration-500 ${
                    idx < currentStep
                      ? 'bg-emerald-500'
                      : 'bg-gray-200'
                  }`}
                  style={{
                    width: 'calc(100% - 32px)',
                    marginLeft: '16px',
                  }}
                />
              )}

              {/* Step Circle */}
              <div
                className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  idx < currentStep
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : idx === currentStep
                    ? 'bg-emerald-600 text-white shadow-lg ring-4 ring-emerald-200'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {idx < currentStep ? (
                  <BiCheck size={24} />
                ) : (
                  idx + 1
                )}
              </div>

              {/* Step Label */}
              <div className="mt-3 text-center">
                <p
                  className={`text-xs font-bold transition-colors duration-300 ${
                    idx <= currentStep ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                >
                  {s.title.split(' ')[0]}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Current Step Info */}
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h2>
              <p className="text-base text-gray-700">{step.description}</p>
            </div>
            <span className="text-sm font-bold text-emerald-700 bg-white px-4 py-2 rounded-full whitespace-nowrap ml-4">
              {currentStep + 1}/{steps.length}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 h-2.5 rounded-full transition-all duration-500 shadow-lg"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Error Message with Animation */}
      {error && (
        <div className="animate-in fade-in slide-in-from-top-2 p-5 bg-red-50 border-l-4 border-red-500 rounded-lg text-sm text-red-800 font-medium shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-bold mb-1">Validation Error</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Content with Smooth Transitions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 md:p-10">
        <div className="animate-in fade-in duration-300">
          {children}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          onClick={onBack}
          disabled={isFirstStep || loading}
          variant="secondary"
          className={`px-8 py-3.5 font-semibold text-base transition-all ${
            isFirstStep ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
          }`}
        >
          <BiChevronLeft size={20} className="mr-2" />
          Back
        </Button>

        {isLastStep ? (
          <Button
            type="submit"
            loading={loading}
            className="flex-1 px-8 py-3.5 font-semibold text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <BiCheck size={20} className="mr-2" />
            Submit Payment
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={loading}
            className="flex-1 px-8 py-3.5 font-semibold text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            Next Step
            <BiChevronRight size={20} className="ml-2" />
          </Button>
        )}
      </div>

      {/* Helpful Footer */}
      <div className="text-center text-xs text-gray-500 space-y-2">
        <p>
          {isLastStep
            ? '✓ Review your information carefully before submitting'
            : `Step ${currentStep + 1} of ${steps.length} • ${Math.round(((currentStep + 1) / steps.length) * 100)}% complete`}
        </p>
      </div>
    </div>
  );
}
