'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch'; // Need to check if this exists or use basic input
import { Label } from '@/components/ui/label';
import { Bell, Smartphone, Send, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { DropletIcon, MoleculeIcon, GearIcon } from '@/components/icons';
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
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full max-w-md md:mr-auto"
            >
                <Card className="border-white/20 dark:border-slate-700/30 bg-white/10 dark:bg-slate-900/20 backdrop-blur-md shadow-xl shadow-emerald-500/5">
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

            {/* FAQ — stacked under settings, no card background */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full"
            >
                <div className="mb-4">
                    <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                        <MoleculeIcon className="w-5 h-5 text-emerald-500" />
                        FAQ
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        How PEPEtide handles your data, identity, and the network it talks to.
                    </p>
                </div>
                <div className="space-y-2">
                    {FAQ_ITEMS.map((item, idx) => (
                        <details
                            key={idx}
                            className="group rounded-lg border border-white/15 dark:border-slate-700/40 px-4 py-3 transition-colors hover:border-emerald-300/40 dark:hover:border-emerald-500/30 open:border-emerald-300/50 dark:open:border-emerald-500/40"
                        >
                            <summary className="flex items-center justify-between cursor-pointer list-none gap-3">
                                <span className="flex items-center gap-2 font-medium text-sm text-slate-900 dark:text-slate-100">
                                    <item.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    {item.q}
                                </span>
                                <ChevronDown className="w-4 h-4 text-slate-500 transition-transform duration-200 group-open:rotate-180 shrink-0" />
                            </summary>
                            <p className="mt-2 pl-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                {item.a}
                            </p>
                        </details>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

const FAQ_ITEMS: { icon: (p: { className?: string }) => React.JSX.Element; q: string; a: string }[] = [
    {
        icon: MoleculeIcon,
        q: 'Is PEPEtide decentralized?',
        a: 'The thread layer is anonymous and lightweight — no accounts, no profiles. Public assets attached to threads (images, snapshots) are pinned to IPFS via Storacha so they live on a content-addressed network instead of a single private server.',
    },
    {
        icon: DropletIcon,
        q: 'Where does my peptide tracking data live?',
        a: 'Your peptides, vials, protocols, and dose logs are stored locally in your browser (IndexedDB) and on your device only. Nothing about your personal stack is uploaded unless you explicitly share it as a thread.',
    },
    {
        icon: GearIcon,
        q: 'What about the Threads / forum content?',
        a: 'Posts go to a shared Postgres database so others can read them. Posts are anonymous — there is no login and no user profile attached. Images you attach are uploaded to IPFS and only the content hash is stored in the database.',
    },
    {
        icon: GearIcon,
        q: 'Do you collect analytics or sell data?',
        a: 'No personal data is sold or shared with third parties. Basic anonymous traffic analytics (page views) run via Vercel Analytics. There is no tracker network, no ad SDKs, and no fingerprinting.',
    },
    {
        icon: DropletIcon,
        q: 'Can I delete my data?',
        a: 'Local data: clear your browser storage for the site and it is gone. Threads you posted: you can delete a thread from the thread page; the database row is removed and the IPFS asset becomes unpinned over time.',
    },
    {
        icon: MoleculeIcon,
        q: 'Why IPFS instead of a regular CDN?',
        a: 'IPFS gives content-addressed, censorship-resistant storage. The same image hash works across multiple gateways, so if one provider goes down the asset is still retrievable from any IPFS node that has it pinned.',
    },
    {
        icon: GearIcon,
        q: 'Is this medical advice?',
        a: 'No. PEPEtide is a tracking and community tool. Nothing here is medical advice; consult a qualified clinician before starting, changing, or stopping any peptide or medication protocol.',
    },
];
