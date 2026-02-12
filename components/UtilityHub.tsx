import React, { useEffect, useState } from "react";
import { getOrCreateReferralCode, getReferralSummary } from "../services/userService";

export type UtilitySection =
  | "invite"
  | "earn"
  | "whatsnew"
  | "help"
  | "feedback"
  | "terms"
  | "privacy"
  | "about";

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
    await navigator.clipboard.writeText(value);
    alert("Copied.");
  };

  return (
    <div className="max-w-3xl mx-auto pt-6 md:pt-10 pb-20 px-4 animate-fade-in">
      <button onClick={onBack} className="mb-6 text-slate-500 hover:text-white text-sm font-black uppercase tracking-widest">
        ← Back
      </button>

      {section === "invite" && (
        <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-5">
          <h2 className="text-3xl font-black text-white">Invite Friends</h2>
          <p className="text-slate-400">Share your invite link. You earn credits when invited users complete their first qualified action.</p>
          <div className="bg-[#131722] border border-slate-800 rounded-2xl p-4 break-all text-cyan-400 font-mono">{inviteLink || "Loading..."}</div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => copy(inviteLink)} className="bg-white text-black px-6 py-3 rounded-xl font-black">Copy Link</button>
            <button onClick={() => copy(code)} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-black">Copy Code</button>
          </div>
        </div>
      )}

      {section === "earn" && (
        <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-5">
          <h2 className="text-3xl font-black text-white">Earn Credits</h2>
          <p className="text-slate-400">Referral rewards: inviter +40 and invitee +20 after first qualified action.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#131722] border border-slate-800 rounded-2xl p-4">
              <div className="text-xs uppercase tracking-widest text-slate-500">Invited</div>
              <div className="text-2xl font-black text-white">{summary?.invitedCount ?? 0}</div>
            </div>
            <div className="bg-[#131722] border border-slate-800 rounded-2xl p-4">
              <div className="text-xs uppercase tracking-widest text-slate-500">Rewarded</div>
              <div className="text-2xl font-black text-white">{summary?.rewardedCount ?? 0}</div>
            </div>
            <div className="bg-[#131722] border border-slate-800 rounded-2xl p-4">
              <div className="text-xs uppercase tracking-widest text-slate-500">Earned</div>
              <div className="text-2xl font-black text-cyan-400">{summary?.earnedCredits ?? 0}</div>
            </div>
          </div>
        </div>
      )}

      {section === "whatsnew" && (
        <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-4">
          <h2 className="text-3xl font-black text-white">What&apos;s New</h2>
          <ul className="space-y-2 text-slate-300">
            <li>Song Ghost brand system is now active across auth, dashboard, and legal copy.</li>
            <li>Database-backed auth and storage are live.</li>
            <li>Referral rewards and OAuth sign-in are now integrated into the public app.</li>
          </ul>
        </div>
      )}

      {section === "help" && (
        <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-4">
          <h2 className="text-3xl font-black text-white">Help</h2>
          <p className="text-slate-400">Need support? Start with these quick answers:</p>
          <ul className="space-y-2 text-slate-300">
            <li>Credits are required for lyric and image generation actions.</li>
            <li>Referral rewards are granted after the invitee completes a qualified action.</li>
            <li>Use Profile and Billing to review transactions and credit activity.</li>
          </ul>
        </div>
      )}

      {section === "feedback" && (
        <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-4">
          <h2 className="text-3xl font-black text-white">Feedback</h2>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us what to improve..."
            className="w-full h-40 bg-[#131722] border border-slate-800 rounded-2xl p-4 text-white outline-none"
          />
          <button
            onClick={() => {
              const subject = encodeURIComponent("Song Ghost Feedback");
              const body = encodeURIComponent(feedback || "Feedback");
              window.location.href = `mailto:hello@songghost.com?subject=${subject}&body=${body}`;
            }}
            className="bg-white text-black px-6 py-3 rounded-xl font-black"
          >
            Send Feedback
          </button>
        </div>
      )}

      {(section === "terms" || section === "privacy") && (
        <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-4">
          <h2 className="text-3xl font-black text-white">{section === "terms" ? "Terms of Service" : "Privacy"}</h2>
          <p className="text-slate-400">Open the full legal page for complete details.</p>
          <button onClick={onOpenTerms} className="bg-white text-black px-6 py-3 rounded-xl font-black">
            Open Legal Page
          </button>
        </div>
      )}

      {section === "about" && (
        <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-4">
          <h2 className="text-3xl font-black text-white">About</h2>
          <p className="text-slate-300">
            Song Ghost helps artists write, refine, and release songs faster while keeping their voice.
          </p>
        </div>
      )}
    </div>
  );
};

export default UtilityHub;
