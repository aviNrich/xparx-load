import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ConnectionsPage } from './pages/connections/ConnectionsPage';
import { ConnectionDetailPage } from './pages/connections/ConnectionDetailPage';
import { SchemasPage } from './pages/schemas/SchemasPage';
import { SchemaDetailPage } from './pages/schemas/SchemaDetailPage';
import { MappingsPage } from './pages/mappings/MappingsPage';
import { MappingCreatePage } from './pages/mappings/MappingCreatePage';
import { MappingDetailPage } from './pages/mappings/MappingDetailPage';
import { RunHistoryPage } from './pages/runs/RunHistoryPage';
import { RunDetailPage } from './pages/runs/RunDetailPage';
import { DeltaLakePage } from './pages/delta-lake/DeltaLakePage';
import { SettingsPage } from './pages/settings/SettingsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/connections/:id" element={<ConnectionDetailPage />} />
          <Route path="/schemas" element={<SchemasPage />} />
          <Route path="/schemas/:id" element={<SchemaDetailPage />} />
          <Route path="/mappings" element={<MappingsPage />} />
          <Route path="/mappings/new" element={<MappingCreatePage />} />
          <Route path="/mappings/:id" element={<MappingDetailPage />} />
          <Route path="/runs" element={<RunHistoryPage />} />
          <Route path="/runs/:runId" element={<RunDetailPage />} />
          <Route path="/delta-lake" element={<DeltaLakePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
