'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { loginAction } from '../actions';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="p-8 pt-12 text-center">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
                            <Sparkles className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Nexus</h1>
                        <p className="text-slate-500 mt-2">Enter the Inspiration Engine</p>
                    </div>

                    <form
                        className="p-8 pt-4 space-y-6"
                        action={async (formData) => {
                            setIsLoading(true);
                            try {
                                await loginAction(formData);
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                    >
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1" htmlFor="username">
                                Identity
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                placeholder="Your Name"
                                required
                                autoComplete="off"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                'Enter System'
                            )}
                        </button>
                    </form>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400 font-medium tracking-tight">
                            SECURED BY NEXUS PROTOCOL v2.0
                        </p>
                    </div>
                </div>

                <p className="text-center mt-8 text-slate-300 text-sm">
                    © 2026 Nexus Inspiration Hub
                </p>
            </div>
        </div>
    );
}

