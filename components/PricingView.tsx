
import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './icons';

interface PricingViewProps {
    email: string;
    onClose: () => void;
    onPurchaseComplete: (newBalance: number) => void;
}

const BASE_PRICING_TIERS = [
    {
        id: 'pro_monthly',
        name: 'Pro Monthly',
        credits: 2000,
        basePrice: 29.00,
        popular: true,
        subtitle: 'Subscription'
    },
    {
        id: 'starter',
        name: 'Starter Credits',
        credits: 250,
        basePrice: 12.00,
        popular: false,
        subtitle: 'One-time'
    },
    {
        id: 'pro',
        name: 'Pro Credits',
        credits: 1000,
        basePrice: 39.00,
        popular: false,
        subtitle: 'One-time'
    }
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
    const discount = isSkool ? 0.5 : 1;

    const handlePurchase = async (tier: typeof BASE_PRICING_TIERS[0]) => {
        setProcessingId(tier.id);
        console.log("CHECKOUT INITIATED for:", tier.id);
        
        try {
            console.log("Calling /api/create-checkout-session...");

            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId: tier.id,
                    email: email
                }),
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

    return (
        <div className="w-full max-w-7xl mx-auto pt-24 md:pt-32 px-4 md:px-6 pb-20 animate-fade-in">
             <div className="text-center mb-16">
                <button onClick={onClose} className="text-slate-500 hover:text-white mb-6 text-sm font-black uppercase tracking-[0.14em] md:tracking-[0.3em]">← Back to Studio</button>
                <h2 className="heading-display text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter">Plans & Credits</h2>
                <p className="text-slate-400 font-black uppercase tracking-[0.14em] md:tracking-[0.2em] text-sm md:text-base">Credits mapped to real generation usage.</p>
                {isSkool && (
                    <div className="mt-4 inline-block rounded-full bg-emerald-500/10 border border-emerald-500/30 px-6 py-2">
                        <span className="text-emerald-400 text-sm font-black uppercase tracking-widest">Skool Member — 50% Off All Purchases</span>
                    </div>
                )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {BASE_PRICING_TIERS.map((tier) => {
                    const price = tier.basePrice * discount;
                    return (
                    <div 
                        key={tier.id}
                        className={`glass-panel relative rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 flex flex-col items-center text-center transition-all hover:scale-[1.02] ${tier.popular ? 'border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.15)]' : 'border-slate-700'}`}
                    >
                        {tier.popular && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-500 text-black px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest">
                                Recommended
                            </div>
                        )}

                        <div className="mb-10 w-full">
                            <h3 className="text-white text-lg md:text-xl font-black uppercase tracking-wide md:tracking-widest mb-4">{tier.name}</h3>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.22em] mb-3">{tier.subtitle}</p>
                            <div className="flex justify-center items-baseline gap-1 mb-2">
                                <span className="text-5xl font-black text-white">${price.toFixed(2)}</span>
                                <span className="text-slate-500 font-bold">{tier.id === 'pro_monthly' ? '/mo' : 'USD'}</span>
                            </div>
                            {isSkool && (
                                <p className="text-emerald-400 text-xs font-bold line-through-none mb-4">
                                    <span className="line-through text-slate-600">${tier.basePrice.toFixed(2)}</span>
                                    <span className="ml-2">50% Off</span>
                                </p>
                            )}
                            <div className="px-6 py-4 bg-slate-900 rounded-2xl inline-block border border-slate-800">
                                <span className="text-cyan-400 font-black text-2xl">{tier.credits} Credits</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handlePurchase(tier)}
                            disabled={!!processingId}
                            className={`w-full py-5 rounded-2xl text-sm md:text-base font-black uppercase tracking-[0.12em] md:tracking-[0.3em] transition-all flex items-center justify-center gap-2 min-h-[64px] mt-auto ${
                                tier.popular 
                                ? 'cta-primary hover:brightness-110 shadow-lg' 
                                : 'cta-secondary text-white hover:bg-slate-700 border border-slate-700'
                            }`}
                        >
                            {processingId === tier.id ? <LoadingSpinner /> : tier.id === 'pro_monthly' ? 'Start Plan' : 'Add Credits'}
                        </button>
                    </div>
                    );
                })}
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
