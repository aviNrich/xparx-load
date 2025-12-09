import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MappingList } from '../components/mappings/MappingList';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';

export const MappingsPage = () => {
  const navigate = useNavigate();

  const handleNewMapping = () => {
    navigate('/mappings/new');
  };

  // Empty array for Phase 1 - no saved mappings yet
  const mappings = [];

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Data Mappings</h1>
            <p className="text-sm text-neutral-500 mt-1">Configure ETL data mappings</p>
          </div>
          <Button
            onClick={handleNewMapping}
            className="bg-primary-500 hover:bg-primary-600 text-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Mapping
          </Button>
        </div>
      </div>

      {/* Mapping List */}
      <MappingList
        mappings={mappings}
        onNew={handleNewMapping}
      />
    </>
  );
}
