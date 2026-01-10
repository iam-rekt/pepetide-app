'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle, CheckCircle2, Clock, TrendingUp, Sparkles,
  Calendar, Calculator, ArrowRight, Zap
} from 'lucide-react';
import { getPeptides, getActiveVials, getActiveProtocols, getDoseLogs } from '@/lib/db';
import { syncData } from '@/lib/sync';
import { getAllSafetyChecks } from '@/lib/safety';
import type { Peptide, PeptideVial, DoseProtocol, DoseLog, ViewMode, SafetyCheck } from '@/types';
import { format } from 'date-fns';

interface DashboardProps {
  onNavigate: (view: ViewMode) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [peptides, setPeptides] = useState<Peptide[]>([]);
  const [vials, setVials] = useState<PeptideVial[]>([]);
  const [protocols, setProtocols] = useState<DoseProtocol[]>([]);
  const [todayLogs, setTodayLogs] = useState<DoseLog[]>([]);
  const [safetyChecks, setSafetyChecks] = useState<SafetyCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [allPeptides, activeVials, activeProtocols, allLogs] = await Promise.all([
        getPeptides(),
        getActiveVials(),
        getActiveProtocols(),
        getDoseLogs(),
      ]);

      setPeptides(allPeptides);
      setVials(activeVials);
      setProtocols(activeProtocols);

      // Filter today's logs
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOnly = allLogs.filter(log => {
        const logDate = new Date(log.scheduledDate);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === today.getTime();
      });
      setTodayLogs(todayOnly);

      // Run safety checks
      const checks = getAllSafetyChecks(allPeptides, activeVials, allLogs);
      setSafetyChecks(checks);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    activePeptides: peptides.length,
    activeVials: vials.length,
    activeProtocols: protocols.length,
    todayDoses: todayLogs.length,
    completedToday: todayLogs.filter(l => l.status === 'taken').length,
  };

  const completionRate = stats.todayDoses > 0
    ? Math.round((stats.completedToday / stats.todayDoses) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-white/5 dark:bg-slate-950/5 border border-white/20 dark:border-slate-700/30 p-[3px] shadow-lg backdrop-blur-sm"
      >
        <div className="relative overflow-hidden rounded-3xl">
          {/* Background decorative elements */}


          <div className="relative p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-1 sm:mb-2"
                >
                  Welcome Back!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm sm:text-base text-slate-600 dark:text-slate-400"
                >
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </motion.p>
              </div>

              {stats.todayDoses > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="text-center sm:text-right"
                >
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 bg-clip-text text-transparent drop-shadow-lg">
                    {completionRate}%
                  </div>
                  <div className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold">Today's Progress</div>
                </motion.div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Peptides', value: stats.activePeptides, icon: Zap, color: 'from-cyan-500 to-blue-600', iconColor: 'text-white', glow: 'shadow-cyan-500/50' },
                { label: 'Vials', value: stats.activeVials, icon: CheckCircle2, color: 'from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100', iconColor: 'text-white dark:text-slate-900', glow: 'shadow-slate-500/30' },
                { label: 'Protocols', value: stats.activeProtocols, icon: Clock, color: 'from-purple-500 to-pink-600', iconColor: 'text-white', glow: 'shadow-purple-500/50' },
                { label: "Today's Doses", value: `${stats.completedToday}/${stats.todayDoses}`, icon: TrendingUp, color: 'from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100', iconColor: 'text-white dark:text-slate-900', glow: 'shadow-slate-500/30' },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * (index + 1) }}
                    className="relative group"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl blur-xl ${stat.glow}`} />
                    <div className="relative p-4 bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-600/30 shadow-lg">
                      <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${stat.color} mb-2 shadow-lg`}>
                        <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                      </div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">{stat.label}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Safety Alerts */}
      {safetyChecks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-white/20 dark:border-slate-700/30 bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Safety Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {safetyChecks.map((check, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className={`p-3 rounded-lg ${check.severity === 'danger'
                    ? 'bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-200'
                    : check.severity === 'warning'
                      ? 'bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200'
                      : 'bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200'
                    }`}
                >
                  <p className="text-sm font-medium">{check.message}</p>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm border-white/20 dark:border-slate-700/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Get started with your peptide tracking</CardDescription>
          </CardHeader>
          <CardContent>
            {peptides.length === 0 ? (
              <div className="text-center py-16">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, type: 'spring', bounce: 0.5 }}
                  className="mx-auto mb-6 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/50"
                >
                  <Sparkles className="w-12 h-12 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">Ready to Track Your First Peptide?</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first peptide stack and start tracking with precision
                </p>
                <Button
                  onClick={() => onNavigate('add-stack')}
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/50 transition-all"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Your First Stack
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    title: 'Add New Stack',
                    desc: 'Create peptide + vial in one flow',
                    icon: Sparkles,
                    action: 'add-stack',
                    gradient: 'from-cyan-500 to-blue-600',
                    glow: 'from-cyan-500/20 to-blue-500/20'
                  },
                  {
                    title: 'Calculator',
                    desc: 'Calculate dosing and volume',
                    icon: Calculator,
                    action: 'calculator',
                    gradient: 'from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100',
                    glow: 'from-slate-500/20 to-slate-600/20'
                  },
                  {
                    title: 'View Calendar',
                    desc: 'Track your daily doses',
                    icon: Calendar,
                    action: 'calendar',
                    gradient: 'from-purple-500 to-pink-600',
                    glow: 'from-purple-500/20 to-pink-500/20'
                  },
                ].map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.div
                      key={action.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                    >
                      <button
                        onClick={() => onNavigate(action.action as ViewMode)}
                        className="relative group w-full text-left p-6 rounded-xl bg-white/5 dark:bg-slate-950/5 backdrop-blur-sm border border-white/20 dark:border-slate-600/30 hover:border-white/40 dark:hover:border-slate-500/50 shadow-lg transition-all duration-300 overflow-hidden"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${action.glow}`} />
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-50 group-hover:opacity-100 transition-opacity duration-300 blur-2xl ${action.glow} rounded-full transform translate-x-16 -translate-y-16`} />

                        <div className="relative">
                          <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${action.gradient} mb-3 shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                          <p className="text-sm text-muted-foreground">{action.desc}</p>
                          <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Today's Schedule */}
      {todayLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm border-white/20 dark:border-slate-700/30">
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>{format(new Date(), 'EEEE, MMMM d, yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.05 }}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${log.status === 'taken'
                      ? 'bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800/30 dark:to-slate-700/30 border-2 border-slate-300 dark:border-slate-600'
                      : 'bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800'
                      }`}
                  >
                    <div>
                      <div className="font-semibold">{log.peptideName}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.targetDose} {log.doseUnit}
                      </div>
                    </div>
                    {log.status === 'taken' && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          Completed
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
