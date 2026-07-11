
import React, { useState, useEffect } from 'react';
import { LoadingSpinner, GhostIcon } from './icons';
import { toast } from './Feedback';
import { apiFetch } from '../lib/api';
import { isNative } from '../lib/platform';
import { createEntitlementService } from '../services/entitlementService';
import { hapticLight } from '../lib/haptics';

interface PricingViewProps {
    email: string;
    onClose: () => void;
    onPurchaseComplete: (newBalance: number) => void;
    onOpenTerms?: () => void;
}

type PlanId = 'pack_50' | 'pro_monthly' | 'pack_100';

// Product ids the store platform expects. Web keeps its existing Stripe price ids
// (api/create-checkout-session.ts); native uses the RevenueCat/StoreKit product ids
// from docs/PLAN.md "Credits & payments" — wired here so entitlementService's native
// path is ready the moment RevenueCat lands, even though NativeEntitlements.purchase()
// is still a stub.
const PRODUCTS: Record<PlanId, { webId: string; nativeId: string; name: string; sub: string; price: string; credits: number; badge?: string; featured?: boolean }> = {
    pack_50: { webId: 'pack_50', nativeId: 'sg_pack_50', name: 'Starter Pack', sub: '50 credits · one-time', price: '$4.99', credits: 50, badge: 'Most Popular', featured: true },
    pro_monthly: { webId: 'pro_monthly', nativeId: 'sg_pro_monthly', name: 'Pro Monthly', sub: 'then $24.99/mo', price: '$24.99/mo', credits: 500, badge: '7-Day Trial' },
    pack_100: { webId: 'pack_100', nativeId: 'sg_pack_100', name: 'Power Pack', sub: '100 credits · one-time', price: '$7.99', credits: 100 },
};

const BENEFITS = [
    '500 credits every month',
    'Priority generation',
    'New genre packs monthly',
    'Credits never expire on packs',
];

const PricingView: React.FC<PricingViewProps> = ({ email, onClose, onOpenTerms }) => {
    const [processingId, setProcessingId] = useState<PlanId | null>(null);
    const [selected, setSelected] = useState<PlanId>('pack_50');
    const [userTier, setUserTier] = useState<string>('public');

    useEffect(() => {
        const fetchTier = async () => {
            try {
                const res = await apiFetch('/api/db', {
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

    const handleContinue = async () => {
        const plan = PRODUCTS[selected];
        setProcessingId(selected);
        hapticLight();
        try {
            const service = createEntitlementService(email);
            const productId = isNative() ? plan.nativeId : plan.webId;
            await service.purchase(productId);
            // Web purchase() redirects the page to Stripe Checkout — nothing further to do here.
        } catch (e: any) {
            console.error('Purchase flow error:', e);
            toast(
                isNative()
                    ? "Purchases aren't live in this build yet — check back soon."
                    : `Payment initialization failed: ${e?.message || 'please try again.'}`,
                'error'
            );
            setProcessingId(null);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto pt-8 md:pt-12 px-5 pb-16 animate-fade-in safe-top safe-bottom safe-x">
            <div className="flex justify-end">
                <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 active:text-white">×</button>
            </div>

            <div className="text-center mt-2 relative">
                <div className="relative w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <div className="absolute inset-[-14px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(226,153,60,0.30), transparent 70%)' }} />
                    <GhostIcon className="relative z-10 h-12 w-auto text-amber-400" />
                </div>
                <h2 className="heading-display text-2xl font-bold text-slate-100 leading-tight">Try Pro Free<br />for 7 Days</h2>
                <p className="mt-2 text-[13px] text-slate-400 leading-relaxed px-2">
                    Unlimited access to the full genre curriculum. No séance required.
                </p>
                {isSkool && !isNative() && (
                    <div className="mt-3 inline-block rounded-full bg-cyan-500/10 border border-cyan-500/30 px-4 py-1.5">
                        <span className="text-cyan-300 text-xs font-bold uppercase tracking-widest">Community Member — 25% off subscription</span>
                    </div>
                )}
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
                {BENEFITS.map((b) => (
                    <div key={b} className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-400 text-amber-300 flex items-center justify-center shrink-0 text-[10px]">✓</span>
                        <span className="text-[13px] font-semibold text-slate-200">{b}</span>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
                {(Object.keys(PRODUCTS) as PlanId[]).map((id) => {
                    const plan = PRODUCTS[id];
                    const isSelected = selected === id;
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => { hapticLight(); setSelected(id); }}
                            className={`relative flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all ${
                                isSelected
                                    ? 'border-amber-400 bg-gradient-to-b from-amber-500/15 to-amber-500/5'
                                    : 'border-slate-700 bg-slate-800'
                            }`}
                        >
                            {plan.featured && (
                                <span className="absolute -top-2.5 left-4 bg-amber-400 text-amber-950 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">Most Popular</span>
                            )}
                            <div className="flex items-center gap-3">
                                <span className={`w-[19px] h-[19px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${isSelected ? 'border-amber-400' : 'border-slate-600'}`}>
                                    {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />}
                                </span>
                                <span>
                                    <span className="flex items-center gap-2">
                                        <span className="text-[13.5px] font-black text-slate-100">{plan.name}</span>
                                        {plan.badge && !plan.featured && (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-cyan-300 border border-cyan-500/40 rounded-full px-1.5 py-0.5">{plan.badge}</span>
                                        )}
                                    </span>
                                    <span className="block text-[11px] text-slate-500 mt-0.5">{plan.sub}</span>
                                </span>
                            </div>
                            <span className={`text-[15px] font-black whitespace-nowrap ${isSelected ? 'text-amber-300' : 'text-slate-100'}`}>{plan.price}</span>
                        </button>
                    );
                })}
            </div>

            <button
                onClick={handleContinue}
                disabled={!!processingId}
                className="cta-primary w-full mt-6 py-[18px] rounded-2xl text-[15px] uppercase tracking-[0.1em] flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-60"
            >
                {processingId ? <LoadingSpinner /> : 'Continue'}
            </button>

            <p className="mt-3 text-[10.5px] leading-relaxed text-slate-500 text-center px-1">
                7-day free trial applies to Pro only. Renews at $24.99/mo unless cancelled 24 hours before trial ends. Credit packs are one-time — no subscription.
            </p>

            <button
                onClick={async () => {
                    try {
                        await createEntitlementService(email).restore();
                        toast('Purchases restored.', 'success');
                    } catch (e: any) {
                        toast(`Restore failed: ${e?.message || 'please try again.'}`, 'error');
                    }
                }}
                className="w-full mt-2.5 text-center text-[12.5px] font-bold text-cyan-300 active:text-cyan-200"
            >
                Restore Purchases
            </button>

            {onOpenTerms && (
                <button onClick={onOpenTerms} className="w-full mt-2 text-center text-[10.5px] text-slate-500 active:text-slate-300">
                    Terms of Use · Privacy Policy
                </button>
            )}

            {/* Web-only: Stripe disclosure. Guideline 3.1.1 — zero web-pricing/payment-processor
                references may render inside the native purchase surface. */}
            {!isNative() && (
                <div className="mt-8 text-center text-[11px] text-slate-600 leading-relaxed">
                    Payments processed securely via Stripe. Credits post after payment confirmation.
                </div>
            )}
        </div>
    );
};

export default PricingView;
