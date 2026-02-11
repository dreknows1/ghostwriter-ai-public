
import React, { useState } from 'react';
import { LoadingSpinner } from './icons';

interface PricingViewProps {
    email: string;
    onClose: () => void;
    onPurchaseComplete: (newBalance: number) => void;
}

const PRICING_TIERS = [
    {
        id: 'starter',
        name: 'Refill Pack',
        credits: 100,
        price: 4.99,
        popular: false
    },
    {
        id: 'studio',
        name: 'Studio Pack',
        credits: 500,
        price: 19.99,
        popular: true
    },
    {
        id: 'label',
        name: 'Label Pack',
        credits: 2000,
        price: 49.99,
        popular: false
    }
];

const PricingView: React.FC<PricingViewProps> = ({ email, onClose }) => {
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handlePurchase = async (tier: typeof PRICING_TIERS[0]) => {
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
                <button onClick={onClose} className="text-slate-500 hover:text-white mb-6 text-sm font-black uppercase tracking-[0.3em]">← Back to Studio</button>
                <h2 className="heading-display text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter">Get More Credits</h2>
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-base">Fuel your creativity. No subscription required.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PRICING_TIERS.map((tier) => (
                    <div 
                        key={tier.id}
                        className={`glass-panel relative rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 flex flex-col items-center text-center transition-all hover:scale-[1.02] ${tier.popular ? 'border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.15)]' : 'border-slate-700'}`}
                    >
                        {tier.popular && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-500 text-black px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest">
                                Most Popular
                            </div>
                        )}

                        <div className="mb-10 w-full">
                            <h3 className="text-white text-xl font-black uppercase tracking-widest mb-4">{tier.name}</h3>
                            <div className="flex justify-center items-baseline gap-1 mb-6">
                                <span className="text-5xl font-black text-white">${tier.price}</span>
                                <span className="text-slate-500 font-bold">USD</span>
                            </div>
                            <div className="px-6 py-4 bg-slate-900 rounded-2xl inline-block border border-slate-800">
                                <span className="text-cyan-400 font-black text-2xl">{tier.credits} Credits</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handlePurchase(tier)}
                            disabled={!!processingId}
                            className={`w-full py-5 rounded-2xl text-base font-black uppercase tracking-[0.22em] md:tracking-[0.3em] transition-all flex items-center justify-center gap-2 min-h-[64px] mt-auto ${
                                tier.popular 
                                ? 'cta-primary hover:brightness-110 shadow-lg' 
                                : 'cta-secondary text-white hover:bg-slate-700 border border-slate-700'
                            }`}
                        >
                            {processingId === tier.id ? <LoadingSpinner /> : 'Purchase Now'}
                        </button>
                    </div>
                ))}
             </div>

             <div className="glass-panel mt-20 text-center max-w-2xl mx-auto p-8 rounded-3xl">
                <h4 className="text-slate-300 font-black uppercase tracking-widest text-sm mb-2">Secure Payments</h4>
                <p className="text-slate-500 text-base leading-relaxed">
                    Payments are processed securely via Stripe. Credits are automatically added to your account immediately after payment confirmation.
                    <br/><span className="text-sm text-slate-600 mt-2 block">(Refresh your studio dashboard to see updated balance)</span>
                </p>
             </div>
        </div>
    );
};

export default PricingView;
