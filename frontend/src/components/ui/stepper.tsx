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
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
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
                  'flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors',
                  isCompleted && 'bg-green-500 text-white',
                  isCurrent && 'bg-primary-500 text-white',
                  isPending && 'bg-neutral-200 text-neutral-500'
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
                    isCurrent && 'text-neutral-900',
                    (isCompleted || isPending) && 'text-neutral-600'
                  )}
                >
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-xs text-neutral-500">{step.description}</div>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div
                  className={cn(
                    'h-0.5 transition-colors',
                    isCompleted ? 'bg-green-500' : 'bg-neutral-200'
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
