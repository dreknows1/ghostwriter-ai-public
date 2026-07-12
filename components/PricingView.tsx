
import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './icons';
import { Rudy } from './Rudy';
import { toast } from './Feedback';
import { apiFetch } from '../lib/api';
import { isNative } from '../lib/platform';
import { createEntitlementService } from '../services/entitlementService';
import { refreshEntitlements } from '../lib/nativeBridge';
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

const PricingView: React.FC<PricingViewProps> = ({ email, onClose, onPurchaseComplete, onOpenTerms }) => {
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
            // Native purchase() resolves in-place: nudge an immediate credit refresh so the
            // paywall reflects the new balance right away. The app-level onPurchaseCompleted
            // listener (App.tsx) additionally bounded-polls for the lagging webhook grant.
            if (isNative()) {
                const updated = await refreshEntitlements(email);
                if (typeof updated === 'number') onPurchaseComplete(updated);
                setProcessingId(null);
            }
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
        <div className="w-full max-w-md mx-auto pt-8 md:pt-12 px-5 pb-16 animate-fade-in safe-top safe-bottom safe-x" style={{ backgroundColor: '#F7F3EA' }}>
            <div className="flex justify-end">
                <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full border flex items-center justify-center text-[#8a8272] active:text-[#1a1a1a]" style={{ borderColor: '#e6dcc6' }}>×</button>
            </div>

            <div className="text-center mt-2 relative">
                <div className="relative w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <div className="absolute inset-[-14px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(43,91,224,0.20), transparent 70%)' }} />
                    <Rudy size={64} variant="art" className="relative z-10" />
                </div>
                <h2 className="heading-display text-2xl font-bold text-[#1a1a1a] leading-tight">Try Pro Free<br />for 7 Days</h2>
                <p className="mt-2 text-[13px] text-[#6b6357] leading-relaxed px-2">
                    Unlimited access to the full genre curriculum. No séance required.
                </p>
                {isSkool && !isNative() && (
                    <div className="mt-3 inline-block rounded-full px-4 py-1.5" style={{ backgroundColor: '#e7edff', border: '1px solid #c9d6ff' }}>
                        <span className="text-[#2b5be0] text-xs font-bold uppercase tracking-widest">Community Member — 25% off subscription</span>
                    </div>
                )}
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
                {BENEFITS.map((b) => (
                    <div key={b} className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] text-[#2b5be0]" style={{ backgroundColor: '#e7edff', border: '1px solid #c9d6ff' }}>✓</span>
                        <span className="text-[13px] font-semibold text-[#1a1a1a]">{b}</span>
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
                            className="relative flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all"
                            style={
                                isSelected
                                    ? { borderColor: '#2b5be0', backgroundColor: '#e7edff' }
                                    : { borderColor: '#e6dcc6', backgroundColor: '#ffffff' }
                            }
                        >
                            {plan.featured && (
                                <span className="absolute -top-2.5 left-4 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#2b5be0' }}>Most Popular</span>
                            )}
                            <div className="flex items-center gap-3">
                                <span className="w-[19px] h-[19px] rounded-full border-[1.5px] flex items-center justify-center shrink-0" style={{ borderColor: isSelected ? '#2b5be0' : '#cbbfa3' }}>
                                    {isSelected && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#2b5be0' }} />}
                                </span>
                                <span>
                                    <span className="flex items-center gap-2">
                                        <span className="text-[13.5px] font-black text-[#1a1a1a]">{plan.name}</span>
                                        {plan.badge && !plan.featured && (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#2b5be0] rounded-full px-1.5 py-0.5" style={{ backgroundColor: '#e7edff' }}>{plan.badge}</span>
                                        )}
                                    </span>
                                    <span className="block text-[11px] text-[#8a8272] mt-0.5">{plan.sub}</span>
                                </span>
                            </div>
                            <span className="text-[15px] font-black whitespace-nowrap" style={{ color: isSelected ? '#2b5be0' : '#1a1a1a' }}>{plan.price}</span>
                        </button>
                    );
                })}
            </div>

            <button
                onClick={handleContinue}
                disabled={!!processingId}
                className="w-full mt-6 py-[18px] rounded-2xl text-[15px] font-extrabold text-white uppercase tracking-[0.1em] flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-60"
                style={{
                    background: 'linear-gradient(150deg,#3f78ff,#2b5be0 55%,#6a3cf0)',
                    boxShadow: '0 14px 30px rgba(47,91,224,.3)',
                }}
            >
                {processingId ? <LoadingSpinner /> : 'Continue'}
            </button>

            <p className="mt-3 text-[10.5px] leading-relaxed text-[#8a8272] text-center px-1">
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
                className="w-full mt-2.5 text-center text-[12.5px] font-bold text-[#2b5be0] active:opacity-70"
            >
                Restore Purchases
            </button>

            {onOpenTerms && (
                <button onClick={onOpenTerms} className="w-full mt-2 text-center text-[10.5px] text-[#8a8272] active:text-[#1a1a1a]">
                    Terms of Use · Privacy Policy
                </button>
            )}

            {/* Web-only: Stripe disclosure. Guideline 3.1.1 — zero web-pricing/payment-processor
                references may render inside the native purchase surface. */}
            {!isNative() && (
                <div className="mt-8 text-center text-[11px] text-[#8a8272] leading-relaxed">
                    Payments processed securely via Stripe. Credits post after payment confirmation.
                </div>
            )}
        </div>
    );
};

export default PricingView;
