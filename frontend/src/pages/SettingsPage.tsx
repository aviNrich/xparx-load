import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { systemSettingsAPI, TargetDatabaseConfig, SystemSettings } from '../services/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<TargetDatabaseConfig>({
    host: '',
    port: 5432,
    database: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await systemSettingsAPI.get();
      setSettings(data);

      // Populate form if settings exist
      if (data.target_db) {
        setFormData({
          host: data.target_db.host,
          port: data.target_db.port,
          database: data.target_db.database,
          username: data.target_db.username,
          password: '', // Don't populate password for security
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof TargetDatabaseConfig, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear test result when form changes
    setTestResult(null);
    setSaveMessage(null);
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const result = await systemSettingsAPI.testTargetDb(formData);
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.response?.data?.detail || 'Failed to test connection',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.host || !formData.database || !formData.username || !formData.password) {
      setSaveMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    // Require test connection before save
    if (!testResult?.success) {
      setSaveMessage({ type: 'error', text: 'Please test the connection successfully before saving' });
      return;
    }

    try {
      setSaving(true);
      setSaveMessage(null);
      const result = await systemSettingsAPI.updateTargetDb(formData);
      setSettings(result);
      setSaveMessage({ type: 'success', text: 'Target database settings saved successfully!' });

      // Clear password field after save
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (error: any) {
      setSaveMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to save settings',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-800">Settings</h1>
        <p className="text-neutral-600 mt-1">Configure system settings and connections</p>
      </div>

      {/* Target Database Section */}
      <Card>
        <CardHeader>
          <CardTitle>Target Database</CardTitle>
          <CardDescription>
            Configure the PostgreSQL target database where ETL data will be written
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Host */}
          <div>
            <Label htmlFor="host">Host *</Label>
            <Input
              id="host"
              type="text"
              placeholder="localhost"
              value={formData.host}
              onChange={(e) => handleInputChange('host', e.target.value)}
            />
          </div>

          {/* Port */}
          <div>
            <Label htmlFor="port">Port *</Label>
            <Input
              id="port"
              type="number"
              placeholder="5432"
              value={formData.port}
              onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 5432)}
            />
          </div>

          {/* Database */}
          <div>
            <Label htmlFor="database">Database Name *</Label>
            <Input
              id="database"
              type="text"
              placeholder="sparx"
              value={formData.database}
              onChange={(e) => handleInputChange('database', e.target.value)}
            />
          </div>

          {/* Username */}
          <div>
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              type="text"
              placeholder="postgres"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
            />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder={settings?.target_db ? '********' : 'Enter password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
            />
            {settings?.target_db && !formData.password && (
              <p className="text-xs text-neutral-500 mt-1">
                Leave blank to keep existing password
              </p>
            )}
          </div>

          {/* Test Result */}
          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              <div className="flex items-start">
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                )}
                <AlertDescription>{testResult.message}</AlertDescription>
              </div>
            </Alert>
          )}

          {/* Save Message */}
          {saveMessage && (
            <Alert variant={saveMessage.type === 'success' ? 'default' : 'destructive'}>
              <div className="flex items-start">
                {saveMessage.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                )}
                <AlertDescription>{saveMessage.text}</AlertDescription>
              </div>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !formData.host || !formData.database || !formData.username || !formData.password}
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving || !testResult?.success}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>

          {/* Last Updated */}
          {settings?.updated_at && (
            <p className="text-xs text-neutral-500 pt-2">
              Last updated: {new Date(settings.updated_at).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Future Settings Sections Placeholder */}
      <div className="mt-6 p-6 border-2 border-dashed border-neutral-200 rounded-lg text-center text-neutral-500">
        <p>Additional settings sections will appear here</p>
      </div>
    </div>
  );
}