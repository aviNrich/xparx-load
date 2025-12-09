import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { MetricCard } from './components/dashboard/MetricCard';
import { MarketDemands } from './components/dashboard/MarketDemands';
import { ItemSuppliers } from './components/dashboard/ItemSuppliers';
import { SourcesPage } from './pages/SourcesPage';
import { Search, Calendar, FileDown, Plus } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { MappingsPage } from './pages/MappingsPage';
import { NewMappingPage } from './pages/NewMappingPage';
import { ColumnMappingPage } from './pages/ColumnMappingPage';
import { SchemaPage } from './pages/SchemaPage';

function DashboardPage() {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="text-neutral-700 font-medium">Sparx Load</span>
          </div>
          <span className="text-neutral-400">/</span>
          <span className="text-neutral-900 font-medium">Dashboard</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 z-10" />
            <Input
              type="text"
              placeholder="Search"
              className="pl-10 pr-16 w-64 text-sm"
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-0.5 text-xs bg-neutral-100 rounded border border-neutral-300">
              ⌘F
            </kbd>
          </div>

          {/* Calendar/Date */}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50 transition-colors">
            <Calendar className="w-4 h-4 text-neutral-600" />
            <span className="text-neutral-700">June</span>
          </button>

          {/* Export PDF */}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-primary-600 hover:bg-primary-50 transition-colors">
            <FileDown className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          {/* Add Workspace */}
          <Button className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Add Workspace</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Overview Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Overview</h1>
            <p className="text-sm text-neutral-500 mt-1">Here is the summary of overall data</p>
          </div>
          <button className="text-neutral-600 hover:text-neutral-900">
            <span className="text-sm">Restart Data</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            icon="amazon"
            title="Amazon"
            ordersCount="1,000 Orders today"
            amount="$265,22"
            percentage="16,3%"
            color="bg-orange-50"
          />
          <MetricCard
            icon="walmart"
            title="Walmart"
            ordersCount="1,200 Orders today"
            amount="$128,14"
            percentage="12,3%"
            color="bg-yellow-50"
          />
          <MetricCard
            icon="tiktok"
            title="Tiktok Shop"
            ordersCount="200 Orders today"
            amount="$87,16"
            percentage="26,3%"
            color="bg-neutral-50"
          />
        </div>

        {/* Market Demands */}
        <MarketDemands />

        {/* Item Suppliers */}
        <ItemSuppliers />
      </div>
    </>
  );
}

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <Router>
      <div className="flex h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200">
        <Sidebar activeItem={activeView} onItemClick={setActiveView} />

        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/sources" element={<SourcesPage />} />
              <Route path="/mappings" element={<MappingsPage />} />
              <Route path="/mappings/new" element={<NewMappingPage />} />
              <Route path="/mappings/:mappingId" element={<NewMappingPage />} />
              <Route path="/mappings/:mappingId/columns" element={<ColumnMappingPage />} />
              <Route path="/schema" element={<SchemaPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
