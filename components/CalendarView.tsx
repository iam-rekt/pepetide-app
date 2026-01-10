'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, XCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfToday } from 'date-fns';
import { getDoseLogs, getPeptides, updateDoseLog } from '@/lib/db';
import type { DoseLog, Peptide } from '@/types';

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [peptides, setPeptides] = useState<Peptide[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [logs, allPeptides] = await Promise.all([
        getDoseLogs(),
        getPeptides(),
      ]);
      setDoseLogs(logs);
      setPeptides(allPeptides);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get logs for a specific date
  const getLogsForDate = (date: Date) => {
    return doseLogs.filter(log => {
      const logDate = new Date(log.scheduledDate);
      return isSameDay(logDate, date);
    });
  };

  // Get status for a date
  const getDateStatus = (date: Date) => {
    const logs = getLogsForDate(date);
    if (logs.length === 0) return 'none';
    const taken = logs.filter(l => l.status === 'taken').length;
    if (taken === logs.length) return 'complete';
    if (taken > 0) return 'partial';
    return 'missed';
  };

  // Toggle dose status
  const toggleDoseStatus = async (log: DoseLog) => {
    const newStatus = log.status === 'taken' ? 'scheduled' : 'taken';
    const actualDate = newStatus === 'taken' ? new Date() : undefined;

    await updateDoseLog(log.id, {
      status: newStatus,
      actualDate,
    });

    // Reload data
    loadData();
  };

  const selectedDateLogs = selectedDate ? getLogsForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dose Calendar</CardTitle>
              <CardDescription>Track your daily peptide intake</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-sm font-medium min-w-[120px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Actual days */}
            {daysInMonth.map((day) => {
              const status = getDateStatus(day);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isToday = isSameDay(day, startOfToday());

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square p-2 rounded-lg border-2 transition-all
                    ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-transparent'}
                    ${isToday ? 'ring-2 ring-blue-300 dark:ring-blue-700' : ''}
                    ${status === 'complete' ? 'bg-green-100 dark:bg-green-950' : ''}
                    ${status === 'partial' ? 'bg-yellow-100 dark:bg-yellow-950' : ''}
                    ${status === 'missed' ? 'bg-red-100 dark:bg-red-950' : ''}
                    hover:border-blue-300 dark:hover:border-blue-700
                  `}
                >
                  <div className="text-sm font-medium">
                    {format(day, 'd')}
                  </div>
                  {status !== 'none' && (
                    <div className="flex justify-center mt-1">
                      {status === 'complete' && (
                        <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                      )}
                      {status === 'partial' && (
                        <Circle className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                      )}
                      {status === 'missed' && (
                        <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-950 border-2 border-transparent" />
              <span className="text-muted-foreground">All doses taken</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-950 border-2 border-transparent" />
              <span className="text-muted-foreground">Partial completion</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-950 border-2 border-transparent" />
              <span className="text-muted-foreground">Missed doses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded ring-2 ring-blue-300 dark:ring-blue-700" />
              <span className="text-muted-foreground">Today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a Date'}
          </CardTitle>
          <CardDescription>
            {selectedDate
              ? selectedDateLogs.length > 0
                ? `${selectedDateLogs.length} dose${selectedDateLogs.length > 1 ? 's' : ''} scheduled`
                : 'No doses scheduled'
              : 'Click a date to view details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDateLogs.length > 0 ? (
            <div className="space-y-3">
              {selectedDateLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border-2 transition-all ${log.status === 'taken'
                      ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold">{log.peptideName}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.targetDose} {log.doseUnit}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={log.status === 'taken' ? 'outline' : 'default'}
                      onClick={() => toggleDoseStatus(log)}
                    >
                      {log.status === 'taken' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Taken
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 mr-1" />
                          Mark Taken
                        </>
                      )}
                    </Button>
                  </div>
                  {log.status === 'taken' && log.actualDate && (
                    <div className="text-xs text-muted-foreground">
                      Taken at {format(new Date(log.actualDate), 'h:mm a')}
                    </div>
                  )}
                  {log.notes && (
                    <div className="text-sm text-muted-foreground mt-2 p-2 bg-white/5 dark:bg-black/5 rounded backdrop-blur-sm">
                      {log.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : selectedDate ? (
            <div className="text-center py-8 text-muted-foreground">
              No doses scheduled for this date
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Select a date to view scheduled doses
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
