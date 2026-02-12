import React from 'react';

interface TermsAndPrivacyProps {
  onBack: () => void;
}

const TermsAndPrivacy: React.FC<TermsAndPrivacyProps> = ({ onBack }) => {
  return (
    <div className="app-shell min-h-screen text-slate-300 p-4 md:p-12 animate-fade-in overflow-y-auto">
      <div className="max-w-4xl mx-auto pb-20">
        <button 
          onClick={onBack} 
          className="mb-10 text-slate-500 hover:text-white transition-all font-black text-sm uppercase tracking-widest flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
        </button>

        <h1 className="heading-display text-4xl md:text-6xl font-black text-white tracking-tighter mb-16">
          Legal & Privacy
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
          
          {/* TERMS OF SERVICE */}
          <section>
            <h2 className="text-2xl font-black text-white tracking-tight mb-8 uppercase flex items-center gap-3">
              <span className="text-blue-500">#</span> Terms of Service
            </h2>
            <div className="space-y-8 text-sm md:text-base leading-relaxed text-slate-400 font-medium">
              <div>
                <strong className="text-white block mb-2 uppercase tracking-wide text-xs">1. Service Description</strong>
                <p>Song Ghost is a professional AI-assisted songwriting and lyrics generation platform designed to help creators break through creative blocks.</p>
              </div>

              <div>
                <strong className="text-white block mb-2 uppercase tracking-wide text-xs">2. Access Requirements</strong>
                <p>Song Ghost is available to the public. You must provide accurate account information and keep your credentials secure.</p>
              </div>

              <div className="glass-panel p-6 rounded-3xl">
                <strong className="text-blue-200 block mb-2 uppercase tracking-wide text-xs">3. Content Ownership</strong>
                <p className="text-blue-100 font-bold">You retain full, exclusive ownership of all lyrics and content generated using this application. Song Ghost claims no intellectual property rights over the output created by your inputs.</p>
              </div>

              <div>
                <strong className="text-white block mb-2 uppercase tracking-wide text-xs">4. Usage Limits</strong>
                <p>Free accounts include 30 monthly credits and a storage limit of 25 songs. Pro plans include 2,000 monthly credits, and one-time top-up packages are available for additional usage.</p>
              </div>

              <div>
                <strong className="text-white block mb-2 uppercase tracking-wide text-xs">5. User Conduct</strong>
                <p>You agree not to use the service to generate hate speech, illegal content, harassment, or content that violates the intellectual property rights of others. Violation of this policy will result in immediate termination.</p>
              </div>

              <div>
                <strong className="text-white block mb-2 uppercase tracking-wide text-xs">6. Disclaimer</strong>
                <p>The service is provided "as is" without any warranties. We do not guarantee that the service will be uninterrupted or error-free.</p>
              </div>

              <div>
                <strong className="text-white block mb-2 uppercase tracking-wide text-xs">7. Limitation of Liability</strong>
                <p>Song Ghost shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.</p>
              </div>
            </div>
          </section>

          {/* PRIVACY POLICY */}
          <section>
            <h2 className="text-2xl font-black text-white tracking-tight mb-8 uppercase flex items-center gap-3">
              <span className="text-emerald-500">#</span> Privacy Policy
            </h2>
            <div className="space-y-8 text-sm md:text-base leading-relaxed text-slate-400 font-medium">
              <div>
                <strong className="text-white block mb-2 uppercase tracking-wide text-xs">1. Data Collection</strong>
                <p>We collect the following information to provide the service: Email address, display name, avatar URL, bio, musical preferences, credit balance, and your generated content.</p>
              </div>

              <div>
                <strong className="text-white block mb-2 uppercase tracking-wide text-xs">2. Third-Party Services</strong>
                <p className="mb-2">We utilize trusted third-party providers:</p>
                <ul className="list-none space-y-2 pl-2">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div> Google Gemini (AI Logic)</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div> Convex / Managed Database (App Data)</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div> Stripe (Billing & Payments)</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div> Vercel (Hosting)</li>
                </ul>
              </div>

              <div>
                <strong className="text-white block mb-2 uppercase tracking-wide text-xs">3. Data Usage & Selling</strong>
                <p>We do not sell your personal data to third parties. Your data is used strictly to provide, maintain, and improve the service.</p>
              </div>

              <div>
                <strong className="text-white block mb-2 uppercase tracking-wide text-xs">4. Data Retention</strong>
                <p>Your data is retained for as long as your account remains active. You may request account deletion at any time to permanently remove your profile and songs.</p>
              </div>

              <div>
                <strong className="text-white block mb-2 uppercase tracking-wide text-xs">5. Security</strong>
                <p>We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.</p>
              </div>

              <div>
                <strong className="text-white block mb-2 uppercase tracking-wide text-xs">6. Contact & Deletion</strong>
                <p>To request data deletion or for privacy inquiries, contact support at support@songghost.com.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-20 pt-10 border-t border-slate-800 text-center">
            <p className="text-slate-600 text-xs font-black uppercase tracking-widest">© 2025 Song Ghost • All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndPrivacy;
