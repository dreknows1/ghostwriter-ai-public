import React, { useEffect, useState } from "react";
import { getOrCreateReferralCode, getReferralSummary } from "../services/userService";
import { toast } from "./Feedback";
import { isNative } from "../lib/platform";
import { copyText } from "../lib/nativeBridge";

export type UtilitySection =
  | "invite"
  | "earn"
  | "whatsnew"
  | "help"
  | "support"
  | "feedback"
  | "terms"
  | "privacy"
  | "about";

const SUPPORT_EMAIL = "support@songghost.com";

interface UtilityHubProps {
  email: string;
  section: UtilitySection;
  onBack: () => void;
  onOpenTerms: () => void;
}

const UtilityHub: React.FC<UtilityHubProps> = ({ email, section, onBack, onOpenTerms }) => {
  const [code, setCode] = useState<string>("");
  const [summary, setSummary] = useState<any>(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const needsReferral = section === "invite" || section === "earn";
    if (!needsReferral) return;

    (async () => {
      const c = await getOrCreateReferralCode(email);
      const s = await getReferralSummary(email);
      setCode(c?.code || "");
      setSummary(s || null);
    })().catch(() => null);
  }, [section, email]);

  const inviteLink = code ? `${window.location.origin}/?ref=${encodeURIComponent(code)}` : "";

  const copy = async (value: string) => {
    if (!value) return;
    await copyText(value);
    toast('Copied to clipboard.', 'success');
  };

  const nativeAndReferral = isNative() && (section === "invite" || section === "earn");

  return (
    <div className="max-w-3xl mx-auto pt-6 md:pt-10 pb-20 px-4 animate-fade-in safe-top safe-bottom safe-x">
      <button onClick={onBack} className="mb-6 text-[#8a8272] active:text-[#1a1a1a] text-sm font-bold uppercase tracking-widest">
        ← Back
      </button>

      {nativeAndReferral && (
        <div className="bg-white border border-[#eadfca] rounded-3xl p-6 md:p-8 space-y-3">
          <h2 className="text-2xl font-bold text-[#1a1a1a]">Not available here</h2>
          <p className="text-[#6b6357]">This feature isn't part of the app yet. Check songghost.com on the web.</p>
        </div>
      )}

      {!nativeAndReferral && section === "invite" && (
        <div className="bg-white border border-[#eadfca] rounded-3xl p-6 md:p-8 space-y-5">
          <h2 className="text-3xl font-black text-[#1a1a1a]">Invite Friends</h2>
          <p className="text-[#6b6357]">Share your invite link. You earn credits when invited users complete their first qualified action.</p>
          <div className="bg-[#f1ece0] border border-[#e7ddc9] rounded-2xl p-4 break-all text-[#2b5be0] font-mono">{inviteLink || "Loading..."}</div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => copy(inviteLink)} className="bg-[#1a1a1a] text-white px-6 py-3 rounded-xl font-black">Copy Link</button>
            <button onClick={() => copy(code)} className="bg-white border border-[#e3d8c1] text-[#1a1a1a] px-6 py-3 rounded-xl font-black">Copy Code</button>
          </div>
        </div>
      )}

      {!nativeAndReferral && section === "earn" && (
        <div className="bg-white border border-[#eadfca] rounded-3xl p-6 md:p-8 space-y-5">
          <h2 className="text-3xl font-black text-[#1a1a1a]">Earn Credits</h2>
          <p className="text-[#6b6357]">Referral rewards: inviter +40 and invitee +20 after first qualified action.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#f1ece0] border border-[#e7ddc9] rounded-2xl p-4">
              <div className="text-xs uppercase tracking-widest text-[#8a8272]">Invited</div>
              <div className="text-2xl font-black text-[#1a1a1a]">{summary?.invitedCount ?? 0}</div>
            </div>
            <div className="bg-[#f1ece0] border border-[#e7ddc9] rounded-2xl p-4">
              <div className="text-xs uppercase tracking-widest text-[#8a8272]">Rewarded</div>
              <div className="text-2xl font-black text-[#1a1a1a]">{summary?.rewardedCount ?? 0}</div>
            </div>
            <div className="bg-[#f1ece0] border border-[#e7ddc9] rounded-2xl p-4">
              <div className="text-xs uppercase tracking-widest text-[#8a8272]">Earned</div>
              <div className="text-2xl font-black text-[#2b5be0]">{summary?.earnedCredits ?? 0}</div>
            </div>
          </div>
        </div>
      )}

      {section === "whatsnew" && (
        <div className="bg-white border border-[#eadfca] rounded-3xl p-6 md:p-8 space-y-4">
          <h2 className="text-3xl font-black text-[#1a1a1a]">What&apos;s New</h2>
          <ul className="space-y-2 text-[#6b6357]">
            <li>Meet Rudy — a fresh look for SongGhost.</li>
            <li>Native accents: every genre sings in its own voice.</li>
            <li>One-tap hand-off to Suno or Udio.</li>
            <li>Sign in with Apple.</li>
          </ul>
        </div>
      )}

      {section === "help" && (
        <div className="bg-white border border-[#eadfca] rounded-3xl p-6 md:p-8 space-y-4">
          <h2 className="text-3xl font-black text-[#1a1a1a]">Help</h2>
          <p className="text-[#6b6357]">Quick answers:</p>
          <ul className="space-y-2 text-[#6b6357]">
            <li>Credits are required for lyric and image generation actions.</li>
            <li>Referral rewards are granted after the invitee completes a qualified action.</li>
            <li>Use Profile and Billing to review transactions and credit activity.</li>
          </ul>
          <p className="text-[#6b6357] pt-2">Need a human? Tap Contact Support in the menu.</p>
        </div>
      )}

      {section === "support" && (
        <div className="bg-white border border-[#eadfca] rounded-3xl p-6 md:p-8 space-y-5">
          <h2 className="text-3xl font-black text-[#1a1a1a]">Contact Support</h2>
          <p className="text-[#6b6357]">Reach our team directly. Replies typically within 1 business day.</p>
          <div className="bg-[#f1ece0] border border-[#e7ddc9] rounded-2xl p-4 break-all text-[#2b5be0] font-mono">{SUPPORT_EMAIL}</div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => copy(SUPPORT_EMAIL)} className="bg-[#1a1a1a] text-white px-6 py-3 rounded-xl font-black">Copy Email</button>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Song Ghost Support")}`}
              className="bg-[#2b5be0] text-white px-6 py-3 rounded-xl font-black text-center"
            >
              Open Mail App
            </a>
          </div>
          <p className="text-[#8a8272] text-xs">If your device has no mail app configured, copy the address and email us from the web.</p>
        </div>
      )}

      {section === "feedback" && (
        <div className="bg-white border border-[#eadfca] rounded-3xl p-6 md:p-8 space-y-4">
          <h2 className="text-3xl font-black text-[#1a1a1a]">Feedback</h2>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us what to improve..."
            className="w-full h-40 bg-white border border-[#e3d8c1] rounded-2xl p-4 text-[#1a1a1a] outline-none focus:border-[#2b5be0]"
          />
          <button
            onClick={() => {
              const subject = encodeURIComponent("Song Ghost Feedback");
              const body = encodeURIComponent(feedback || "Feedback");
              window.location.href = `mailto:hello@songghost.com?subject=${subject}&body=${body}`;
            }}
            className="bg-[#1a1a1a] text-white px-6 py-3 rounded-xl font-black"
          >
            Send Feedback
          </button>
        </div>
      )}

      {(section === "terms" || section === "privacy") && (
        <div className="bg-white border border-[#eadfca] rounded-3xl p-6 md:p-8 space-y-4">
          <h2 className="text-3xl font-black text-[#1a1a1a]">{section === "terms" ? "Terms of Service" : "Privacy"}</h2>
          <p className="text-[#6b6357]">Open the full legal page for complete details.</p>
          <button onClick={onOpenTerms} className="bg-[#1a1a1a] text-white px-6 py-3 rounded-xl font-black">
            Open Legal Page
          </button>
        </div>
      )}

      {section === "about" && (
        <div className="bg-white border border-[#eadfca] rounded-3xl p-6 md:p-8 space-y-4">
          <h2 className="text-3xl font-black text-[#1a1a1a]">About</h2>
          <p className="text-[#6b6357]">
            Song Ghost helps artists write, refine, and release songs faster while keeping their voice.
          </p>
        </div>
      )}
    </div>
  );
};

export default UtilityHub;
