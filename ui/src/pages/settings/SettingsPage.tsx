import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/LoadingState';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { TargetDbForm } from './components/TargetDbForm';

export function SettingsPage() {
  const settings = useSystemSettings();

  return (
    <PageContainer>
      <PageHeader title="Settings" description="Configure system settings" />

      {settings.loading ? (
        <LoadingState variant="inline" text="Loading settings..." />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Target Database Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <TargetDbForm settings={settings} />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
