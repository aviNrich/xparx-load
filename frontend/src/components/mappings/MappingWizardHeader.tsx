import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Stepper, Step } from '../ui/stepper';
import { ArrowLeft } from 'lucide-react';

const WIZARD_STEPS: Step[] = [
  {
    id: 'source-preview',
    label: 'Source Preview',
    description: 'Configure source and preview data',
  },
  {
    id: 'column-mapping',
    label: 'Column Mapping',
    description: 'Map source to target columns',
  },
  {
    id: 'scheduling',
    label: 'Schedule & Execute',
    description: 'Configure execution schedule',
  },
];

interface MappingWizardHeaderProps {
  title: string;
  description: string;
  currentStep: number;
  onBack?: () => void;
  backLink?: string;
}

export function MappingWizardHeader({
  title,
  description,
  currentStep,
  onBack,
  backLink = '/mappings',
}: MappingWizardHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-slate-100 via-gray-100 to-zinc-100 border-b border-gray-300 flex-shrink-0 shadow-sm">
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {onBack ? (
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="gap-2 text-neutral-700 hover:bg-white/80 hover:text-neutral-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-2 text-neutral-700 hover:bg-white/80 hover:text-neutral-900"
              >
                <Link to={backLink}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
              <p className="text-sm text-neutral-600 mt-0.5">{description}</p>
            </div>
          </div>
        </div>

        {/* Stepper - Integrated into colored header */}
        <div className="mt-4">
          <Stepper steps={WIZARD_STEPS} currentStep={currentStep} variant="light" />
        </div>
      </div>
    </div>
  );
}
