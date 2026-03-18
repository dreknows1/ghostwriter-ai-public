
import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './icons';

interface PricingViewProps {
    email: string;
    onClose: () => void;
    onPurchaseComplete: (newBalance: number) => void;
}

const SUBSCRIPTION = {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    credits: 500,
    basePrice: 24.99,
    subtitle: 'Best Value — Subscription',
};

const CREDIT_PACKS = [
    { id: 'pack_250', credits: 250, price: 14.99 },
    { id: 'pack_100', credits: 100, price: 7.99 },
    { id: 'pack_50', credits: 50, price: 4.99 },
];

const PricingView: React.FC<PricingViewProps> = ({ email, onClose }) => {
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [userTier, setUserTier] = useState<string>('public');

    useEffect(() => {
        const fetchTier = async () => {
            try {
                const res = await fetch('/api/db', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getUserProfileByEmail', payload: { email } }),
                });
                const json = await res.json();
                if (json.data?.tier) setUserTier(json.data.tier);
            } catch (e) {
                console.error('Failed to fetch tier:', e);
            }
        };
        fetchTier();
    }, [email]);

    const isSkool = userTier === 'skool';
    const subDiscount = isSkool ? 0.75 : 1;

    const handlePurchase = async (priceId: string) => {
        setProcessingId(priceId);
        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId, email }),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errText}`);
            }

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Payment system error. No redirect URL.");
                setProcessingId(null);
            }
        } catch (e: any) {
            console.error("Purchase Flow Error:", e);
            alert(`Payment initialization failed: ${e.message}`);
            setProcessingId(null);
        }
    };

    const subPrice = SUBSCRIPTION.basePrice * subDiscount;
    const subPerCredit = (subPrice / SUBSCRIPTION.credits).toFixed(3);

    return (
        <div className="w-full max-w-7xl mx-auto pt-24 md:pt-32 px-4 md:px-6 pb-20 animate-fade-in">
             <div className="text-center mb-16">
                <button onClick={onClose} className="text-slate-500 hover:text-white mb-6 text-sm font-black uppercase tracking-[0.14em] md:tracking-[0.3em]">&larr; Back to Studio</button>
                <h2 className="heading-display text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter">Plans & Credits</h2>
                <p className="text-slate-400 font-black uppercase tracking-[0.14em] md:tracking-[0.2em] text-sm md:text-base">Credits mapped to real generation usage.</p>
                {isSkool && (
                    <div className="mt-4 inline-block rounded-full bg-emerald-500/10 border border-emerald-500/30 px-6 py-2">
                        <span className="text-emerald-400 text-sm font-black uppercase tracking-widest">Community Member &mdash; 25% Off Subscription</span>
                    </div>
                )}
             </div>

             {/* ── Subscription (Hero) ── */}
             <div className="max-w-lg mx-auto mb-16">
                <div className="glass-panel relative rounded-[2.5rem] md:rounded-[3.5rem] p-10 md:p-14 flex flex-col items-center text-center border-cyan-400 shadow-[0_0_60px_rgba(6,182,212,0.2)] transition-all hover:scale-[1.02]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-500 text-black px-8 py-2.5 rounded-full text-sm font-black uppercase tracking-widest">
                        Best Value
                    </div>

                    <h3 className="text-white text-2xl md:text-3xl font-black uppercase tracking-wide md:tracking-widest mb-2 mt-4">{SUBSCRIPTION.name}</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.22em] mb-6">{SUBSCRIPTION.subtitle}</p>

                    <div className="flex justify-center items-baseline gap-1 mb-3">
                        <span className="text-6xl md:text-7xl font-black text-white">${subPrice.toFixed(2)}</span>
                        <span className="text-slate-500 font-bold text-lg">/mo</span>
                    </div>

                    {isSkool && (
                        <p className="text-emerald-400 text-xs font-bold mb-4">
                            <span className="line-through text-slate-600">${SUBSCRIPTION.basePrice.toFixed(2)}</span>
                            <span className="ml-2">Community Discount (25% Off)</span>
                        </p>
                    )}

                    <div className="px-8 py-5 bg-slate-900 rounded-2xl inline-block border border-slate-800 mb-3">
                        <span className="text-cyan-400 font-black text-3xl">{SUBSCRIPTION.credits} Credits</span>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">${subPerCredit}/credit &middot; ~50 songs/mo</p>

                    <button
                        onClick={() => handlePurchase(SUBSCRIPTION.id)}
                        disabled={!!processingId}
                        className="w-full py-6 rounded-2xl text-base md:text-lg font-black uppercase tracking-[0.12em] md:tracking-[0.3em] transition-all flex items-center justify-center gap-2 min-h-[72px] cta-primary hover:brightness-110 shadow-lg"
                    >
                        {processingId === SUBSCRIPTION.id ? <LoadingSpinner /> : 'Start Plan'}
                    </button>
                </div>
             </div>

             {/* ── Credit Packs ── */}
             <div className="max-w-3xl mx-auto">
                <h3 className="text-center text-slate-500 font-black uppercase tracking-[0.2em] text-xs mb-6">Or buy credits one-time</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {CREDIT_PACKS.map((pack) => {
                        const perCredit = (pack.price / pack.credits).toFixed(3);
                        return (
                            <div
                                key={pack.id}
                                className="glass-panel rounded-2xl md:rounded-3xl p-6 flex flex-col items-center text-center border-slate-700 transition-all hover:scale-[1.02]"
                            >
                                <span className="text-cyan-400 font-black text-xl mb-1">{pack.credits} Credits</span>
                                <div className="flex items-baseline gap-1 mb-1">
                                    <span className="text-3xl font-black text-white">${pack.price.toFixed(2)}</span>
                                </div>
                                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-4">${perCredit}/credit</p>

                                <button
                                    onClick={() => handlePurchase(pack.id)}
                                    disabled={!!processingId}
                                    className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cta-secondary text-white hover:bg-slate-700 border border-slate-700"
                                >
                                    {processingId === pack.id ? <LoadingSpinner /> : 'Buy'}
                                </button>
                            </div>
                        );
                    })}
                </div>
             </div>

             <div className="glass-panel mt-20 text-center max-w-2xl mx-auto p-8 rounded-3xl">
                <h4 className="text-slate-300 font-black uppercase tracking-widest text-sm mb-2">Secure Payments</h4>
                <p className="text-slate-500 text-base leading-relaxed">
                    Payments are processed securely via Stripe. Credits are granted after payment confirmation and may take a moment to appear.
                    <br/><span className="text-sm text-slate-600 mt-2 block">If balance is unchanged, refresh your Song Ghost dashboard.</span>
                </p>
             </div>
        </div>
    );
};

export default PricingView;
