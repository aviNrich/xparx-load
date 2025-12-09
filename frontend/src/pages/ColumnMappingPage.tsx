import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Stepper, Step } from '../components/ui/stepper';
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
];

export function ColumnMappingPage() {
  const navigate = useNavigate();
  const { mappingId } = useParams<{ mappingId: string }>();

  const handleBack = () => {
    if (mappingId) {
      // Navigate to step 1 with the mapping ID
      navigate(`/mappings/${mappingId}`);
    } else {
      navigate('/mappings');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {/* Header - Fixed */}
      <div className="bg-white border-b border-neutral-200 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">Column Mapping</h1>
                <p className="text-xs text-neutral-500">Map source columns to target</p>
              </div>
            </div>

            {/* Action Buttons in Header */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/mappings')}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={true}
                size="sm"
                className="bg-neutral-400 cursor-not-allowed"
              >
                Next (Coming Soon)
              </Button>
            </div>
          </div>
        </div>

        {/* Stepper - Full Width Below Header */}
        <div className="px-6 pb-4">
          <Stepper steps={WIZARD_STEPS} currentStep={2} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-neutral-400 mb-4">
            <svg className="mx-auto h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Column Mapping</h2>
          <p className="text-sm text-neutral-500 mb-1">This step is coming soon!</p>
          <p className="text-xs text-neutral-400">Mapping ID: {mappingId}</p>
        </div>
      </div>
    </div>
  );
}
