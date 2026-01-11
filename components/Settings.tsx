'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch'; // Need to check if this exists or use basic input
import { Label } from '@/components/ui/label';
import { Bell, Smartphone, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { syncData } from '@/lib/sync';

export default function Settings() {
    const [browserEnabled, setBrowserEnabled] = useState(false);
    const [telegramEnabled, setTelegramEnabled] = useState(false);
    const [telegramCode, setTelegramCode] = useState<string | null>(null);
    const [telegramConnected, setTelegramConnected] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check Notification permission
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setBrowserEnabled(Notification.permission === 'granted');
        }

        // Load local connection state
        const savedUserId = localStorage.getItem('pepetide_user_id');
        if (savedUserId) {
            setTelegramCode(savedUserId);
            // Ideally check API if connected
            checkConnectionStatus(savedUserId);
        }
    }, []);

    async function checkConnectionStatus(userId: string) {
        try {
            const res = await fetch(`/api/user/${userId}/status`);
            if (res.ok) {
                const data = await res.json();
                setTelegramConnected(data.telegramConnected);
                setTelegramEnabled(true);
            }
        } catch (e) {
            console.error('Failed to check status', e);
        }
    }

    const handleBrowserToggle = async () => {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notifications');
            return;
        }

        if (!browserEnabled) {
            const permission = await Notification.requestPermission();
            setBrowserEnabled(permission === 'granted');
            if (permission === 'granted') {
                new Notification('Notifications Enabled', {
                    body: 'You will now receive alerts for missed doses.',
                    icon: '/pwaicon.png'
                });
            }
        } else {
            // Cannot programmatically revoke, just update state used by app
            setBrowserEnabled(false);
        }
    };

    const handleTelegramToggle = async () => {
        if (telegramEnabled) {
            // Disconnect flow
            if (confirm('Disconnect Telegram? You will stop receiving remote alerts.')) {
                setTelegramEnabled(false);
                setTelegramConnected(false);
                // Ideally call API to unlink
            }
            return;
        }

        setLoading(true);
        try {
            // 1. Create or get User ID
            let userId: string | null = localStorage.getItem('pepetide_user_id');

            if (!userId) {
                // Create new user
                console.log('Creating new user...');
                const res = await fetch('/api/user/create', { method: 'POST' });

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error('Failed to create user:', res.status, errorText);
                    throw new Error(`Failed to create user: ${res.status}`);
                }

                const data = await res.json();
                console.log('User created:', data);

                if (!data.userId || typeof data.userId !== 'string') {
                    throw new Error('No valid userId returned from API');
                }

                userId = data.userId as string;
                localStorage.setItem('pepetide_user_id', userId);
            }

            // TypeScript now knows userId is definitely a string here
            console.log('Using userId:', userId);
            setTelegramCode(userId);
            setTelegramEnabled(true);
        } catch (e) {
            console.error('Telegram connection error:', e);
            alert(`Failed to initialize connection: ${e instanceof Error ? e.message : 'Unknown error'}\n\nCheck the browser console for details.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="border-white/20 dark:border-slate-700/30 bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            Notification Settings
                        </CardTitle>
                        <CardDescription>
                            Manage how you want to be reminded about your peptide doses.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Browser Notifications */}
                        <div className="flex items-center justify-between space-x-4">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="browser-notifs" className="font-medium flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-slate-500" />
                                    Device Notifications
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                    Receive alerts on this device when app is open.
                                </span>
                            </div>
                            <Button
                                variant={browserEnabled ? "default" : "outline"}
                                size="sm"
                                onClick={handleBrowserToggle}
                                className={browserEnabled ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                                {browserEnabled ? "Enabled" : "Enable"}
                            </Button>
                        </div>

                        <div className="h-px bg-slate-200 dark:bg-slate-800" />

                        {/* Telegram Notifications */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between space-x-4">
                                <div className="flex flex-col space-y-1">
                                    <Label className="font-medium flex items-center gap-2">
                                        <Send className="w-4 h-4 text-blue-500" />
                                        Telegram Bot
                                    </Label>
                                    <span className="text-xs text-muted-foreground">
                                        Get remote "pings" for missed doses anywhere.
                                    </span>
                                </div>
                                <Button
                                    variant={telegramConnected ? "default" : (telegramEnabled ? "secondary" : "outline")}
                                    size="sm"
                                    onClick={handleTelegramToggle}
                                    disabled={loading}
                                    className={telegramConnected ? "bg-blue-600 hover:bg-blue-700" : ""}
                                >
                                    {telegramConnected ? "Connected" : (telegramEnabled ? "Setup..." : "Connect")}
                                </Button>
                            </div>

                            {/* Bot Setup Instructions */}
                            {telegramEnabled && !telegramConnected && telegramCode && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm border border-blue-100 dark:border-blue-800"
                                >
                                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        Complete Setup
                                    </h4>
                                    <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
                                        <li>
                                            Open Telegram and find
                                            <a href={`https://t.me/Pepetidebot?start=${telegramCode}`} target="_blank" rel="noreferrer" className="font-bold underline ml-1">
                                                @Pepetidebot
                                            </a>
                                        </li>
                                        <li>Click <strong>Start</strong> or send the command:</li>
                                        <li className="font-mono bg-white dark:bg-black/20 p-2 rounded select-all text-center">
                                            /start {telegramCode}
                                        </li>
                                    </ol>
                                    <p className="mt-3 text-xs text-blue-600 dark:text-blue-400">
                                        Once you send the message, this status will update automatically.
                                    </p>
                                </motion.div>
                            )}

                            {telegramConnected && (
                                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm flex items-center gap-2 text-green-800 dark:text-green-200">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Your account is linked successfully.
                                </div>
                            )}
                        </div>

                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
