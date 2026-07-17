import React from 'react';
import { UtilitySection } from './UtilityHub';
import { isNative } from '../lib/platform';
import { openExternal } from '../lib/nativeBridge';

/**
 * The app menu drawer, shared by the LANDING and STUDIO views. Previously each
 * view carried its own copy-pasted drawer and they drifted (the studio copy
 * kept dead social buttons and lost the "Set AI Key" item). One component,
 * one truth.
 */

const SocialXIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path d="M18.9 2H22l-6.8 7.7L23 22h-6.6l-5.1-6.6L5.4 22H2.2l7.3-8.3L2 2h6.7l4.6 6zM17.7 20h1.8L7.7 3.9H5.8z" />
  </svg>
);

const SocialInstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const SocialYouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path d="M23 12s0-3.1-.4-4.6a3 3 0 00-2.1-2.1C19 5 12 5 12 5s-7 0-8.5.3a3 3 0 00-2.1 2.1C1 8.9 1 12 1 12s0 3.1.4 4.6a3 3 0 002.1 2.1C5 19 12 19 12 19s7 0 8.5-.3a3 3 0 002.1-2.1C23 15.1 23 12 23 12zM10 15.5V8.5L16 12l-6 3.5z" />
  </svg>
);

const SocialTikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path d="M14 3c.4 2 1.6 3.3 3.7 3.6V9a7 7 0 01-3.7-1v6.8a5.8 5.8 0 11-5.1-5.8v2.6a3.2 3.2 0 103 3.2V3z" />
  </svg>
);

const SocialDiscordIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path d="M20 5.4A16 16 0 0016.1 4l-.2.4a11 11 0 00-4-.1l-.2-.4A16 16 0 007.8 5.4C5 9.6 4.2 13.7 4.4 17.7A16.5 16.5 0 009 20l.8-1.2a10.4 10.4 0 01-1.6-.8l.4-.3c3.2 1.5 6.7 1.5 9.8 0l.4.3c-.5.3-1 .5-1.6.8L18 20a16.5 16.5 0 004.6-2.3c.3-4.6-.6-8.6-2.6-12.3zM9.8 14.8c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8zm4.4 0c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8z" />
  </svg>
);

/** Social profiles. Fill in a url to make its icon appear in the drawer footer. */
const SOCIALS: Array<{ name: string; icon: React.ReactNode; url: string }> = [
  { name: 'X', icon: <SocialXIcon />, url: '' },
  { name: 'Instagram', icon: <SocialInstagramIcon />, url: '' },
  { name: 'YouTube', icon: <SocialYouTubeIcon />, url: '' },
  { name: 'TikTok', icon: <SocialTikTokIcon />, url: '' },
  { name: 'Discord', icon: <SocialDiscordIcon />, url: '' },
];

// Referral/earn entries are stripped on native — guideline 3.1.1 territory (they
// point at web-only reward mechanics not wired into IAP), and the invite flow
// isn't part of the v1 native surface (docs/PLAN.md "Create experience").
const UTILITY_ITEMS: Array<[string, UtilitySection, { webOnly?: boolean }?]> = [
  ['Invite Friends', 'invite', { webOnly: true }],
  ['Earn Credits', 'earn', { webOnly: true }],
  ["What's New?", 'whatsnew'],
  ['Help', 'help'],
  ['Contact Support', 'support'],
  ['Feedback', 'feedback'],
  ['Terms of Service', 'terms'],
  ['Privacy', 'privacy'],
  ['About', 'about'],
];

const ITEM_CLASS =
  'w-full text-left px-4 py-3 rounded-xl text-[15px] font-semibold leading-snug text-[#1a1a1a] active:bg-[#f1ece0] transition-colors';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSetAiKey: () => void;
  onOpenUtility: (section: UtilitySection) => void;
  onOpenPricing: () => void;
}

export default function MenuDrawer({ isOpen, onClose, onSetAiKey, onOpenUtility, onOpenPricing }: MenuDrawerProps) {
  if (!isOpen) return null;

  const visibleSocials = SOCIALS.filter((s) => s.url);
  const native = isNative();
  const visibleUtilityItems = UTILITY_ITEMS.filter(([, , opts]) => !(native && opts?.webOnly));

  return (
    <>
      <button
        aria-label="Close menu overlay"
        onClick={onClose}
        className="fixed inset-0 z-[65] bg-black/40"
      />
      <div className="fixed right-3 top-16 bottom-3 z-[70] w-[19rem] rounded-[1.1rem] border border-[#eadfca] bg-white shadow-[0_10px_30px_rgba(90,70,30,0.15)] flex flex-col overflow-hidden safe-bottom">
        <div className="p-3 overflow-y-auto">
          <button
            onClick={() => { onOpenPricing(); onClose(); }}
            className={`${ITEM_CLASS} text-[#2b5be0]`}
          >
            Pricing &amp; Credits
          </button>
          {!native && (
            <button
              onClick={() => { onSetAiKey(); onClose(); }}
              className={`${ITEM_CLASS} text-[#2b5be0]`}
            >
              Set AI Key
            </button>
          )}
          <button
            onClick={() => {
              openExternal('https://blog.songghost.com/home');
              onClose();
            }}
            className={ITEM_CLASS}
          >
            Blog
          </button>
          {visibleUtilityItems.map(([label, key]) => (
            <button
              key={key}
              onClick={() => onOpenUtility(key)}
              className={ITEM_CLASS}
            >
              {label}
            </button>
          ))}
        </div>
        {visibleSocials.length > 0 && (
          <div className="border-t border-[#eadfca] p-3">
            <div className="flex items-center justify-around text-[#6b6357]">
              {visibleSocials.map((social) => (
                <button
                  key={social.name}
                  onClick={() => openExternal(social.url)}
                  className="w-9 h-9 rounded-full border border-[#e3d8c1] flex items-center justify-center active:bg-[#f1ece0]"
                  aria-label={social.name}
                  title={social.name}
                >
                  {social.icon}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
