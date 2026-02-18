import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  variant?: 'light' | 'dark';
}

export function Stepper({ steps, currentStep, className, variant = 'light' }: StepperProps) {
  const isDark = variant === 'dark';

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isPending = stepNumber > currentStep;

        return (
          <React.Fragment key={step.id}>
            {/* Step Item */}
            <div className="flex items-center gap-3">
              {/* Circle Indicator */}
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all duration-300 border-2',
                  isCompleted && !isDark && 'bg-purple-500 text-white border-purple-500 shadow-sm',
                  isCompleted && isDark && 'bg-white text-purple-600 border-white shadow-sm',
                  isCurrent && !isDark && 'bg-purple-600 text-white border-purple-600 shadow-md ring-4 ring-purple-100',
                  isCurrent && isDark && 'bg-white text-purple-600 border-white shadow-md ring-4 ring-white/20',
                  isPending && !isDark && 'bg-white text-neutral-400 border-neutral-300',
                  isPending && isDark && 'bg-purple-500/10 text-white/50 border-purple-400/30'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{stepNumber}</span>
                )}
              </div>

              {/* Step Label */}
              <div>
                <div
                  className={cn(
                    'text-sm font-semibold transition-colors',
                    isCurrent && !isDark && 'text-neutral-900',
                    isCurrent && isDark && 'text-white',
                    isCompleted && !isDark && 'text-neutral-700',
                    isCompleted && isDark && 'text-purple-100',
                    isPending && !isDark && 'text-neutral-500',
                    isPending && isDark && 'text-purple-300/60'
                  )}
                >
                  {step.label}
                </div>
                {step.description && (
                  <div
                    className={cn(
                      'text-xs mt-0.5 transition-colors',
                      isCurrent && !isDark && 'text-neutral-600',
                      isCompleted && !isDark && 'text-neutral-500',
                      isPending && !isDark && 'text-neutral-400',
                      isDark && isCurrent && 'text-purple-100',
                      isDark && !isCurrent && 'text-purple-300/50'
                    )}
                  >
                    {step.description}
                  </div>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div
                  className={cn(
                    'h-0.5 transition-all duration-300',
                    isCompleted && !isDark && 'bg-purple-500',
                    isCompleted && isDark && 'bg-white/60',
                    !isCompleted && !isDark && 'bg-neutral-300',
                    !isCompleted && isDark && 'bg-purple-400/30'
                  )}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
