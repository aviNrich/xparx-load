import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Stepper, Step } from '../components/ui/stepper';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, Loader2, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import { mappingAPI, executionAPI, ExecutionResponse } from '../services/api';
import { scheduleAPI } from '../services/schedule.api';
import { Mapping } from '../types/mapping';
import { ScheduleMode, ScheduleType, IntervalUnit, WeekDay, ScheduleConfiguration } from '../types/schedule';

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

const INTERVAL_UNITS: { value: IntervalUnit; label: string }[] = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
];

const WEEK_DAYS: { value: WeekDay; label: string }[] = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
];

export function SchedulingPage() {
  const navigate = useNavigate();
  const { mappingId } = useParams<{ mappingId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResponse | null>(null);
  const [mapping, setMapping] = useState<Mapping | null>(null);

  // Schedule configuration state
  const [mode, setMode] = useState<ScheduleMode>('once');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('interval');
  const [enabled, setEnabled] = useState(true);

  // Interval config
  const [intervalValue, setIntervalValue] = useState<number>(1);
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>('hours');

  // Daily config
  const [dailyTime, setDailyTime] = useState<string>('02:00');

  // Weekly config
  const [weeklyDays, setWeeklyDays] = useState<WeekDay[]>(['mon']);
  const [weeklyTime, setWeeklyTime] = useState<string>('09:00');

  // Cron config
  const [cronExpression, setCronExpression] = useState<string>('0 2 * * *');

  useEffect(() => {
    const loadData = async () => {
      if (!mappingId) {
        setError('Mapping ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load mapping
        const mappingData = await mappingAPI.get(mappingId);
        setMapping(mappingData);

        // Try to load existing schedule
        try {
          const existingSchedule = await scheduleAPI.get(mappingId);
          if (existingSchedule) {
            setMode(existingSchedule.mode);
            setEnabled(existingSchedule.enabled);

            if (existingSchedule.schedule_type) {
              setScheduleType(existingSchedule.schedule_type);

              if (existingSchedule.schedule_type === 'interval' && existingSchedule.interval) {
                setIntervalValue(existingSchedule.interval.value);
                setIntervalUnit(existingSchedule.interval.unit);
              } else if (existingSchedule.schedule_type === 'daily' && existingSchedule.daily) {
                setDailyTime(existingSchedule.daily.time);
              } else if (existingSchedule.schedule_type === 'weekly' && existingSchedule.weekly) {
                setWeeklyDays(existingSchedule.weekly.days);
                setWeeklyTime(existingSchedule.weekly.time);
              } else if (existingSchedule.schedule_type === 'cron' && existingSchedule.cron_expression) {
                setCronExpression(existingSchedule.cron_expression);
              }
            }
          }
        } catch (err: any) {
          // Ignore 404 - no schedule exists yet
          if (err.response?.status !== 404) {
            throw err;
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [mappingId]);

  const handleRunNow = async () => {
    if (!mappingId) return;

    try {
      setExecuting(true);
      setError(null);
      setSuccess(null);

      const result = await executionAPI.run(mappingId);
      setExecutionResult(result);

      if (result.status === 'success') {
        setSuccess(`Successfully executed! ${result.rows_written} rows written to ${result.delta_table_path}`);
      } else {
        setError(`Execution failed: ${result.error_message}`);
      }
    } catch (err) {
      console.error('Failed to execute mapping:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute mapping');
    } finally {
      setExecuting(false);
    }
  };

  const handleSave = async () => {
    if (!mappingId) return;

    try {
      setSaving(true);
      setError(null);

      const config: ScheduleConfiguration = {
        mapping_id: mappingId,
        mode,
        enabled,
      };

      if (mode === 'scheduled') {
        config.schedule_type = scheduleType;

        if (scheduleType === 'interval') {
          config.interval = {
            value: intervalValue,
            unit: intervalUnit,
          };
        } else if (scheduleType === 'daily') {
          config.daily = {
            time: dailyTime,
          };
        } else if (scheduleType === 'weekly') {
          if (weeklyDays.length === 0) {
            setError('Please select at least one day for weekly schedule');
            return;
          }
          config.weekly = {
            days: weeklyDays,
            time: weeklyTime,
          };
        } else if (scheduleType === 'cron') {
          if (!cronExpression.trim()) {
            setError('Please enter a cron expression');
            return;
          }
          config.cron_expression = cronExpression;
        }
      }

      await scheduleAPI.create(config);
      navigate('/mappings');
    } catch (err) {
      console.error('Failed to save schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const toggleWeekDay = (day: WeekDay) => {
    setWeeklyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/mappings')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Mappings
          </Button>
          <h1 className="text-xl font-semibold">ETL Mapping Wizard</h1>
        </div>

        {/* Progress Stepper */}
        <Stepper steps={WIZARD_STEPS} currentStep={2} />

        {/* Mapping Info */}
        {mapping && (
          <div className="mt-4 p-3 bg-neutral-50 rounded-md">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-neutral-600">Mapping: </span>
                <span className="font-medium text-neutral-900">{mapping.name}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Schedule & Execute</h2>
          <p className="text-neutral-600 mb-6">
            Configure when this mapping should run
          </p>

          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Execution Mode */}
            <div className="bg-white border border-neutral-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Execution Mode</h3>
              <div className="space-y-3">
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    mode === 'once'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                  onClick={() => setMode('once')}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        mode === 'once' ? 'border-primary-500' : 'border-neutral-300'
                      }`}
                    >
                      {mode === 'once' && (
                        <div className="w-3 h-3 rounded-full bg-primary-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">Run Once</p>
                      <p className="text-sm text-neutral-600">
                        Execute immediately when you're ready (manual trigger)
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    mode === 'scheduled'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                  onClick={() => setMode('scheduled')}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        mode === 'scheduled' ? 'border-primary-500' : 'border-neutral-300'
                      }`}
                    >
                      {mode === 'scheduled' && (
                        <div className="w-3 h-3 rounded-full bg-primary-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">Schedule</p>
                      <p className="text-sm text-neutral-600">
                        Set up recurring automatic execution
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Configuration (only if scheduled) */}
            {mode === 'scheduled' && (
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Schedule Configuration</h3>

                {/* Schedule Type Selector */}
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2">Schedule Type</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setScheduleType('interval')}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        scheduleType === 'interval'
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      Interval
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType('daily')}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        scheduleType === 'daily'
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      Daily
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType('weekly')}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        scheduleType === 'weekly'
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType('cron')}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        scheduleType === 'cron'
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      Cron
                    </button>
                  </div>
                </div>

                {/* Interval Configuration */}
                {scheduleType === 'interval' && (
                  <div className="space-y-4 p-4 bg-neutral-50 rounded-md">
                    <div>
                      <Label className="text-sm font-medium mb-2">Run Every</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          type="number"
                          min="1"
                          value={intervalValue}
                          onChange={(e) => setIntervalValue(parseInt(e.target.value) || 1)}
                          className="w-24"
                        />
                        <select
                          value={intervalUnit}
                          onChange={(e) => setIntervalUnit(e.target.value as IntervalUnit)}
                          className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                        >
                          {INTERVAL_UNITS.map((unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Daily Configuration */}
                {scheduleType === 'daily' && (
                  <div className="space-y-4 p-4 bg-neutral-50 rounded-md">
                    <div>
                      <Label className="text-sm font-medium mb-2">Run At</Label>
                      <Input
                        type="time"
                        value={dailyTime}
                        onChange={(e) => setDailyTime(e.target.value)}
                        className="w-40 mt-2"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Runs once every day at this time
                      </p>
                    </div>
                  </div>
                )}

                {/* Weekly Configuration */}
                {scheduleType === 'weekly' && (
                  <div className="space-y-4 p-4 bg-neutral-50 rounded-md">
                    <div>
                      <Label className="text-sm font-medium mb-2">Run On</Label>
                      <div className="flex gap-2 mt-2">
                        {WEEK_DAYS.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleWeekDay(day.value)}
                            className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                              weeklyDays.includes(day.value)
                                ? 'bg-primary-500 text-white border-primary-500'
                                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2">At Time</Label>
                      <Input
                        type="time"
                        value={weeklyTime}
                        onChange={(e) => setWeeklyTime(e.target.value)}
                        className="w-40 mt-2"
                      />
                    </div>
                  </div>
                )}

                {/* Cron Configuration */}
                {scheduleType === 'cron' && (
                  <div className="space-y-4 p-4 bg-neutral-50 rounded-md">
                    <div>
                      <Label className="text-sm font-medium mb-2">Cron Expression</Label>
                      <Input
                        type="text"
                        value={cronExpression}
                        onChange={(e) => setCronExpression(e.target.value)}
                        placeholder="0 2 * * *"
                        className="font-mono mt-2"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Format: minute hour day month weekday
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Run Now Button (only for "once" mode) */}
            {mode === 'once' && (
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Execute Now</h3>
                    <p className="text-sm text-neutral-600">
                      Run this ETL mapping immediately
                    </p>
                  </div>
                  <Button
                    onClick={handleRunNow}
                    disabled={executing}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {executing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Run Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Enable/Disable Toggle (only for "scheduled" mode) */}
            {mode === 'scheduled' && (
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Enable Schedule</h3>
                    <p className="text-sm text-neutral-600">
                      {enabled
                        ? 'Schedule is active and will run as configured'
                        : 'Schedule is disabled and will not run'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnabled(!enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enabled ? 'bg-primary-500' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-200 px-6 py-4 bg-white">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`/mappings/${mappingId}/columns`)}
            disabled={saving}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary-500 hover:bg-primary-600 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finish
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
