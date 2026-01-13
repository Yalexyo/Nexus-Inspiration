'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { loginAction } from '../actions';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-[400px] shrink-0">
                <div className="bg-white border-2 border-black p-8 pt-12">
                    <div className="text-left mb-10">
                        <div className="w-12 h-12 bg-accent flex items-center justify-center mb-6">
                            <Sparkles className="text-white w-6 h-6" />
                        </div>
                        <h1 className="text-5xl font-black text-black tracking-tighter mb-2">NEXUS</h1>
                        <p className="text-black font-medium text-sm tracking-wide uppercase">Inspiration Engine. System v2.0</p>
                    </div>

                    <form
                        className="space-y-8"
                        action={async (formData) => {
                            setIsLoading(true);
                            try {
                                await loginAction(formData);
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                    >
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-black uppercase tracking-widest block" htmlFor="username">
                                Identity
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                className="w-full px-4 py-4 bg-white border-2 border-black text-black placeholder:text-gray-400 focus:outline-none focus:bg-muted transition-colors font-mono text-lg"
                                placeholder="USERNAME"
                                required
                                autoComplete="off"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border-2 border-black"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                'Enter System'
                            )}
                        </button>
                    </form>

                    <div className="mt-12 pt-6 border-t-2 border-black text-left">
                        <p className="text-[10px] text-black font-mono tracking-tight">
                            SECURED BY NEXUS PROTOCOL
                        </p>
                    </div>
                </div>

                <p className="text-left mt-8 text-gray-500 text-xs font-mono uppercase">
                    © 2026 Nexus Inc.
                </p>
            </div>
        </div>
    );
}

