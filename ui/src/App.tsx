import { BrowserRouter as Router } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-neutral-50">
        <div className="container mx-auto p-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-4">
            ETL Engine - New UI
          </h1>
          <p className="text-neutral-600">
            Your new UI is ready! Start building your components here.
          </p>
          <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-neutral-200">
            <h2 className="text-xl font-semibold mb-2">Available Infrastructure:</h2>
            <ul className="list-disc list-inside space-y-1 text-neutral-700">
              <li>API layer with all endpoints (services/api.ts)</li>
              <li>TypeScript types for all entities</li>
              <li>React hooks (useConnections, useSchemas, useMappings, useTables)</li>
              <li>UI components library from Radix UI</li>
              <li>Tailwind CSS with custom theme</li>
            </ul>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
