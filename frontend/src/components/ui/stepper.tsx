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
                  'flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors border-2',
                  isCompleted && !isDark && 'bg-green-500 text-white border-green-500',
                  isCompleted && isDark && 'bg-white text-green-600 border-white',
                  isCurrent && !isDark && 'bg-primary-500 text-white border-primary-500',
                  isCurrent && isDark && 'bg-white text-primary-600 border-white',
                  isPending && !isDark && 'bg-neutral-200 text-neutral-500 border-neutral-200',
                  isPending && isDark && 'bg-primary-500/20 text-white border-primary-400/40'
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
                    'text-sm font-semibold',
                    isCurrent && !isDark && 'text-neutral-900',
                    isCurrent && isDark && 'text-white',
                    isCompleted && !isDark && 'text-neutral-600',
                    isCompleted && isDark && 'text-primary-100',
                    isPending && !isDark && 'text-neutral-600',
                    isPending && isDark && 'text-primary-200/60'
                  )}
                >
                  {step.label}
                </div>
                {step.description && (
                  <div
                    className={cn(
                      'text-xs mt-0.5',
                      !isDark && 'text-neutral-500',
                      isDark && isCurrent && 'text-primary-100',
                      isDark && !isCurrent && 'text-primary-200/50'
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
                    'h-0.5 transition-colors',
                    isCompleted && !isDark && 'bg-green-500',
                    isCompleted && isDark && 'bg-white/60',
                    !isCompleted && !isDark && 'bg-neutral-200',
                    !isCompleted && isDark && 'bg-primary-400/30'
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
