import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSchedule } from '@/hooks/useSchedule';
import {
  ScheduleMode,
  ScheduleType,
  IntervalUnit,
  WeekDay,
} from '@/types/schedule';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ScheduleEditorProps {
  mappingId: string;
}

const ALL_DAYS: { value: WeekDay; label: string }[] = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
];

export function ScheduleEditor({ mappingId }: ScheduleEditorProps) {
  const { schedule, loading, saveSchedule } = useSchedule(mappingId);
  const [saving, setSaving] = useState(false);

  // Local state
  const [mode, setMode] = useState<ScheduleMode>('once');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('interval');
  const [intervalValue, setIntervalValue] = useState(30);
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>('minutes');
  const [dailyTime, setDailyTime] = useState('09:00');
  const [weeklyDays, setWeeklyDays] = useState<WeekDay[]>(['mon']);
  const [weeklyTime, setWeeklyTime] = useState('09:00');
  const [cronExpression, setCronExpression] = useState('0 * * * *');
  const [enabled, setEnabled] = useState(true);

  // Populate from existing schedule
  useEffect(() => {
    if (schedule) {
      setMode(schedule.mode);
      setEnabled(schedule.enabled);
      if (schedule.schedule_type) setScheduleType(schedule.schedule_type);
      if (schedule.interval) {
        setIntervalValue(schedule.interval.value);
        setIntervalUnit(schedule.interval.unit);
      }
      if (schedule.daily) {
        setDailyTime(schedule.daily.time);
      }
      if (schedule.weekly) {
        setWeeklyDays(schedule.weekly.days);
        setWeeklyTime(schedule.weekly.time);
      }
      if (schedule.cron_expression) {
        setCronExpression(schedule.cron_expression);
      }
    }
  }, [schedule]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const config: any = {
        mapping_id: mappingId,
        mode,
        enabled,
      };

      if (mode === 'scheduled') {
        config.schedule_type = scheduleType;
        if (scheduleType === 'interval') {
          config.interval = { value: intervalValue, unit: intervalUnit };
        } else if (scheduleType === 'daily') {
          config.daily = { time: dailyTime };
        } else if (scheduleType === 'weekly') {
          config.weekly = { days: weeklyDays, time: weeklyTime };
        } else if (scheduleType === 'cron') {
          config.cron_expression = cronExpression;
        }
      }

      await saveSchedule(config);
      toast.success('Schedule saved successfully');
    } catch (err: any) {
      toast.error(`Failed to save schedule: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: WeekDay) => {
    setWeeklyDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Schedule Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode toggle */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-neutral-700">Run Mode</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'once' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('once')}
            >
              Run Once
            </Button>
            <Button
              type="button"
              variant={mode === 'scheduled' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('scheduled')}
            >
              Scheduled
            </Button>
          </div>
        </div>

        {/* Scheduled config */}
        {mode === 'scheduled' && (
          <>
            {/* Schedule type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Schedule Type</Label>
              <Select value={scheduleType} onValueChange={(val) => setScheduleType(val as ScheduleType)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interval">Interval</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="cron">Cron Expression</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Interval */}
            {scheduleType === 'interval' && (
              <div className="flex items-end gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-neutral-700">Every</Label>
                  <Input
                    type="number"
                    min={1}
                    value={intervalValue}
                    onChange={(e) => setIntervalValue(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
                <Select value={intervalUnit} onValueChange={(val) => setIntervalUnit(val as IntervalUnit)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Daily */}
            {scheduleType === 'daily' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-neutral-700">Time</Label>
                <Input
                  type="time"
                  value={dailyTime}
                  onChange={(e) => setDailyTime(e.target.value)}
                  className="w-40"
                />
              </div>
            )}

            {/* Weekly */}
            {scheduleType === 'weekly' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-neutral-700">Days</Label>
                  <div className="flex gap-2">
                    {ALL_DAYS.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors border',
                          weeklyDays.includes(day.value)
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-neutral-700">Time</Label>
                  <Input
                    type="time"
                    value={weeklyTime}
                    onChange={(e) => setWeeklyTime(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>
            )}

            {/* Cron */}
            {scheduleType === 'cron' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-neutral-700">Cron Expression</Label>
                <Input
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                  placeholder="0 * * * *"
                  className="w-64 font-mono"
                />
                <p className="text-xs text-neutral-500">
                  Standard cron format: minute hour day month weekday
                </p>
              </div>
            )}

            {/* Enabled toggle */}
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium text-neutral-700">Enabled</Label>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => setEnabled(!enabled)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  enabled ? 'bg-primary-600' : 'bg-neutral-300'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    enabled ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          </>
        )}

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
