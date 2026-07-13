
import React, { useState, useEffect } from 'react';
import { UserProfile, SavedSong, Transaction } from '../types';
import { getUserProfile, upsertUserProfile, deleteUserProfile, getUserTransactions } from '../services/userService';
import { getSavedSongs, deleteSong, deleteAllUserSongs } from '../services/songService';
import { COSTS, hasEnoughCredits, formatCredits } from '../services/creditService';
import { toast, confirmDialog } from './Feedback';
import {
    LoadingSpinner, ProfileIcon, TrashIcon, ImageIcon,
    HomeIcon, WalletIcon, ClockIcon, LogoutIcon, GhostIcon
} from './icons';
import { Rudy } from './Rudy';

interface ProfileViewProps {
  email: string;
  onLoadSong: (song: SavedSong) => void;
  onBack: () => void;
  onSignOut: () => void;
  onProfileUpdate?: (updated: UserProfile) => void;
  onBuyCredits: () => void;
  onCreateNew?: () => void;
  initialTab?: string;
}

type Tab = 'overview' | 'profile' | 'wallet' | 'history';

const ART_STYLES = [
    "Cinematic Realism",
    "Cyberpunk / Neon",
    "Anime / Manga",
    "Digital Oil Painting",
    "3D Render (Octane)",
    "Minimalist Vector",
    "Vintage Film Photography",
    "Dark Fantasy",
    "Surrealism"
];

const ProfileView: React.FC<ProfileViewProps> = ({ email, onLoadSong, onBack, onSignOut, onProfileUpdate, onBuyCredits, onCreateNew, initialTab }) => {
  const [activeTab, setActiveTab] = useState<Tab>((initialTab as Tab) ?? 'overview');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [songs, setSongs] = useState<SavedSong[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit State
  const [editData, setEditData] = useState({ 
    display_name: '', 
    preferred_vibe: '', 
    preferred_art_style: '',
    bio: '',
    avatar_url: '' 
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [profileResult, songsResult, txResult] = await Promise.allSettled([
          getUserProfile(email),
          getSavedSongs(email),
          getUserTransactions(email)
        ]);
        const p = profileResult.status === 'fulfilled' ? profileResult.value : null;
        const s = songsResult.status === 'fulfilled' ? songsResult.value : [];
        const t = txResult.status === 'fulfilled' ? txResult.value : [];

        setProfile(p);
        setSongs(s || []);
        setTransactions(t || []);

        if (profileResult.status === 'rejected' || songsResult.status === 'rejected' || txResult.status === 'rejected') {
          console.error("Partial dashboard load failure:", {
            profileError: profileResult.status === 'rejected' ? profileResult.reason : null,
            songsError: songsResult.status === 'rejected' ? songsResult.reason : null,
            txError: txResult.status === 'rejected' ? txResult.reason : null,
          });
        }
        
        if (p) {
            setEditData({
                display_name: p.display_name || '',
                preferred_vibe: p.preferred_vibe || '',
                preferred_art_style: p.preferred_art_style || 'Cinematic Realism',
                bio: p.bio || '',
                avatar_url: p.avatar_url || ''
            });
        } else {
            setEditData({
                display_name: email.split('@')[0],
                preferred_vibe: '',
                preferred_art_style: 'Cinematic Realism',
                bio: '',
                avatar_url: ''
            });
        }
      } catch (err) {
        console.error("Dashboard data load failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [email]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const baseProfile = profile || { user_email: email, credits: 0 };
      const updatedProfilePayload = { ...baseProfile, ...editData, user_email: email };
      
      const result = await upsertUserProfile(updatedProfilePayload);
      const data: any = result.data || null;
      // The avatar charge is server-authoritative: the mutation deducts CREATE_AVATAR
      // on the first avatar and rejects (persisting everything BUT the avatar) when
      // the balance can't cover it. Honor that reply so the client can't show a
      // free avatar the server refused.
      const avatarRejected = !!data?.avatarRejected;
      const avatarCharged = !!data?.avatarCharged;
      const effectiveAvatarUrl = avatarRejected ? (profile?.avatar_url || '') : updatedProfilePayload.avatar_url;

      // Map back from the result to ensure internal state is clean
      const finalUpdated: UserProfile = data ? {
          ...updatedProfilePayload,
          id: data.id || updatedProfilePayload.id,
          avatar_url: effectiveAvatarUrl,
          credits: data.credits ?? updatedProfilePayload.credits,
          // Ensure we normalize the database email back to our user_email prop
          user_email: data.email || updatedProfilePayload.user_email
      } : updatedProfilePayload;

      setProfile(finalUpdated);
      // Keep the edit form in sync when the server declined to persist the avatar.
      if (avatarRejected) setEditData(prev => ({ ...prev, avatar_url: effectiveAvatarUrl }));
      if (onProfileUpdate) onProfileUpdate(finalUpdated);

      if (avatarRejected) {
        toast('Not enough credits to add your avatar — the rest of your profile was saved.', { kind: 'error', actionLabel: 'Buy credits', onAction: onBuyCredits });
      } else if (avatarCharged) {
        toast(`Profile saved. Avatar created — ${COSTS.CREATE_AVATAR} credits used.`, 'success');
      } else {
        toast('Profile updated successfully.', 'success');
      }
    } catch (err) {
      console.error("Save error:", err);
      toast('Failed to save profile.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 512;
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                if (dataUrl && dataUrl.length > 100) {
                    const isMember = (profile?.tier || '').toLowerCase() === 'skool';
                    const alreadyHasAvatar = !!(profile?.avatar_url || editData.avatar_url);
                    const willCharge = !isMember && !alreadyHasAvatar;
                    if (willCharge) {
                        // UX pre-check only — NOT the authoritative spend. The charge is
                        // enforced server-side in upsertUserProfileByEmail when the profile
                        // is saved (empty→present avatar transition). This just avoids
                        // letting a broke user stage an avatar they can't afford.
                        const canAfford = await hasEnoughCredits(email, COSTS.CREATE_AVATAR);
                        if (!canAfford) {
                            toast('Even ghosts need fuel — top up to keep the hooks coming.', { kind: 'error', actionLabel: 'Buy credits', onAction: onBuyCredits });
                            return;
                        }
                    }
                    setEditData(prev => ({...prev, avatar_url: dataUrl}));
                    const msg = isMember ? 'Avatar updated. Free for members.' : alreadyHasAvatar ? 'Avatar updated.' : `Avatar staged — save your profile to apply (${COSTS.CREATE_AVATAR} credits).`;
                    toast(msg, 'success');
                }
            }
            img.src = readerEvent.target?.result as string;
        }
        reader.readAsDataURL(file);
    }
  };

  const handleDeleteSong = async (id: string) => {
    const ok = await confirmDialog({ title: 'Delete song', message: 'Permanently delete this song record?', confirmLabel: 'Delete', danger: true });
    if (ok) {
      await deleteSong(id, email);
      setSongs(prev => prev.filter(s => s.id !== id));
      toast('Song deleted.', 'success');
    }
  };

  const handleDeleteAccount = async () => {
      const ok = await confirmDialog({
          title: 'Delete account',
          message: 'This will permanently delete your account, credits, and all songs. This action cannot be undone.',
          confirmLabel: 'Delete everything',
          danger: true,
      });
      if (ok) {
          try {
              await deleteAllUserSongs(email);
              await deleteUserProfile(email);
              onSignOut();
          } catch(e) {
              toast('Error deleting account.', 'error');
          }
      }
  };

  const getNextRefillDate = () => {
    if (!profile) return null;
    // Fallback to current date if last_reset_date is missing (e.g. legacy or new user not yet synced)
    const baseDate = profile.last_reset_date ? new Date(profile.last_reset_date) : new Date();
    const nextDate = new Date(baseDate);
    nextDate.setDate(baseDate.getDate() + 30);
    return nextDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const nextRefillDate = getNextRefillDate();

  const getPlanState = () => {
    const latestProTx = transactions.find((t) => /pro monthly/i.test(t.item));
    if (!latestProTx) {
      return { plan: 'Free', isActive: true, renewalDate: null as string | null };
    }

    const txDate = new Date(latestProTx.date);
    const renewal = new Date(txDate);
    renewal.setDate(renewal.getDate() + 30);
    const isActive = renewal.getTime() > Date.now();

    return {
      plan: isActive ? 'Pro Monthly' : 'Free',
      isActive,
      renewalDate: renewal.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
    };
  };

  const planState = getPlanState();

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <LoadingSpinner />
      <span className="mt-4 text-sm font-black uppercase tracking-[0.3em] text-[#8a8272]">Loading Account Data...</span>
    </div>
  );

  const NavItem = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
      <button
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all mb-2 ${activeTab === id ? 'bg-[#e7edff] text-[#2b5be0]' : 'text-[#6b6357] active:bg-[#efe7d7] active:text-[#1a1a1a]'}`}
      >
          <Icon />
          <span className="text-sm font-black uppercase tracking-[0.2em]">{label}</span>
      </button>
  );

  return (
    <div className="max-w-7xl mx-auto pt-6 md:pt-8 pb-24 px-4 animate-fade-in flex flex-col md:flex-row gap-8 relative safe-top safe-bottom safe-x bg-[#F7F3EA]">
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            style={{ bottom: 'calc(88px + var(--safe-bottom, 0px))', background: 'linear-gradient(150deg,#3f78ff,#2b5be0 55%,#6a3cf0)' }}
            className="fixed right-5 z-40 flex items-center gap-2 px-5 py-3.5 rounded-full text-[13px] uppercase tracking-widest text-white font-black shadow-lg active:scale-[0.97] transition-all"
          >
            <Rudy size={16} variant="vector" /> New Song
          </button>
        )}
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
            <button onClick={onBack} className="mb-8 text-[#6b6357] active:text-[#1a1a1a] transition-all font-black text-sm uppercase tracking-widest flex items-center gap-2 group">
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Studio
            </button>

            <div className="bg-white border border-[#e7ddc9] rounded-[1.5rem] md:rounded-[2rem] p-4 flex flex-col shadow-sm">
                <div className="px-4 py-6 mb-4 border-b border-[#eadfca] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#f1ece0] border border-[#e3d8c1] overflow-hidden flex-shrink-0">
                         {editData.avatar_url ? <img src={editData.avatar_url} className="w-full h-full object-cover" /> : <div className="p-3 text-[#8a8272]"><ProfileIcon /></div>}
                    </div>
                    <div className="overflow-hidden">
                        <h3 className="text-[#1a1a1a] font-bold text-base truncate">{editData.display_name || 'User'}</h3>
                        <p className="text-xs text-[#8a8272] truncate">{email}</p>
                    </div>
                </div>

                <NavItem id="overview" icon={HomeIcon} label="Dashboard" />
                <NavItem id="profile" icon={ProfileIcon} label="Profile Details" />
                <NavItem id="wallet" icon={WalletIcon} label="Billing & Credits" />
                <NavItem id="history" icon={ClockIcon} label="Studio History" />

                <div className="mt-8 pt-4 border-t border-[#eadfca]">
                    <button onClick={onSignOut} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[#6b6357] active:text-red-500 active:bg-red-50 transition-all">
                        <LogoutIcon />
                        <span className="text-sm font-black uppercase tracking-[0.2em]">Sign Out</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-in">
                    <div>
                        <h2 className="heading-display text-3xl md:text-4xl font-black text-[#1a1a1a] tracking-tighter mb-2">Welcome back, {profile?.display_name?.split(' ')[0] || 'Artist'}.</h2>
                        <p className="text-[#6b6357] font-bold uppercase tracking-widest text-sm">Here is what's happening in your studio today.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-[#e7edff] border border-[#d4deff] rounded-[2rem] md:rounded-[2.5rem] p-8 relative overflow-hidden">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#2b5be0] mb-4">Available Credits</h3>
                            <div className="text-5xl md:text-6xl font-black text-[#1a1a1a] mb-2">{formatCredits(profile?.credits ?? 0)}</div>

                            {nextRefillDate && (
                                <div className="mb-4 inline-block px-3 py-1 bg-white/70 rounded-lg border border-[#d4deff]">
                                     <span className="text-xs text-[#2b5be0] font-bold uppercase tracking-wider">Next Refill: {nextRefillDate}</span>
                                </div>
                            )}

                            <button onClick={onBuyCredits} style={{ background: 'linear-gradient(150deg,#3f78ff,#2b5be0 55%,#6a3cf0)' }} className="mt-2 w-full px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all shadow-lg active:scale-[0.98]">Add Credits</button>
                            <p className="mt-4 text-[10px] text-[#8a8272] uppercase tracking-widest leading-relaxed">
                                *Free tier: 25/mo. Members: 100/mo. Pro subscription: 500/mo.
                            </p>
                        </div>

                        <div className="bg-white border border-[#e7ddc9] rounded-[2rem] md:rounded-[2.5rem] p-8 shadow-sm">
                             <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#8a8272] mb-4">Total Sessions</h3>
                             <div className="text-5xl md:text-6xl font-black text-[#1a1a1a] mb-2">{songs.length}</div>
                             <p className="text-[#6b6357] text-sm">Mastered tracks in catalog</p>
                        </div>

                        <div className="bg-white border border-[#e7ddc9] rounded-[2rem] md:rounded-[2.5rem] p-8 shadow-sm">
                             <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#8a8272] mb-4">Membership Status</h3>
                             <div className="text-2xl font-black text-[#1a1a1a] mb-2 uppercase">{planState.plan}</div>
                             <p className={`text-sm font-bold uppercase tracking-widest ${planState.isActive ? 'text-emerald-600' : 'text-[#2b5be0]'}`}>
                               ● {planState.isActive ? 'Active' : 'Inactive'}
                             </p>
                             {planState.plan === 'Pro Monthly' && planState.renewalDate && (
                                <p className="mt-2 text-xs text-[#8a8272] uppercase tracking-widest">
                                  Renewal Date: <span className="text-[#1a1a1a]">{planState.renewalDate}</span>
                                </p>
                             )}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-4">
                             <h3 className="text-xl font-black text-[#1a1a1a] tracking-tight">Recent Activity</h3>
                             <button onClick={() => setActiveTab('history')} className="text-sm font-bold uppercase tracking-widest text-[#2b5be0] active:text-[#1a1a1a]">View All</button>
                        </div>
                        {songs.length > 0 ? (
                            <div className="rounded-2xl border border-[#e7ddc9] divide-y divide-[#eadfca] overflow-hidden">
                                {songs.slice(0, 3).map(song => (
                                    <div key={song.id} className="bg-white p-4 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-11 h-11 bg-[#efe7d7] rounded-xl flex items-center justify-center text-[#8a8272] shrink-0">
                                                {song.album_art ? <img src={song.album_art} className="w-full h-full object-cover rounded-xl" /> : <ImageIcon />}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-[#1a1a1a] text-sm truncate">{song.title}</h4>
                                                <p className="text-xs text-[#8a8272]">{new Date(song.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => onLoadSong(song)} className="text-xs font-bold uppercase tracking-widest text-[#2b5be0] active:text-[#1a1a1a] shrink-0">Open</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center border border-[#e7ddc9] border-dashed rounded-3xl text-[#6b6357] text-sm flex flex-col items-center gap-3">
                                <Rudy size={110} variant="art" className="mx-auto mb-4" />
                                No spirits in your discography yet — write one and I'll haunt it for you.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
                <div className="animate-fade-in max-w-2xl">
                    <h2 className="text-3xl font-black text-[#1a1a1a] tracking-tighter mb-8">Profile Settings</h2>

                    <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                             <div className="col-span-2">
                                <label className="block text-sm font-black uppercase tracking-widest text-[#8a8272] mb-3">Display Name</label>
                                <input type="text" value={editData.display_name} onChange={e => setEditData({...editData, display_name: e.target.value})} className="w-full bg-white border border-[#e3d8c1] p-4 rounded-2xl text-[#1a1a1a] text-base outline-none focus:border-[#2b5be0] transition-all" />
                             </div>

                             {/* AVATAR UPLOAD SECTION */}
                             <div className="col-span-2">
                                <label className="block text-sm font-black uppercase tracking-widest text-[#8a8272] mb-3">Avatar Image</label>
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-[#f1ece0] border border-[#e3d8c1] overflow-hidden flex-shrink-0">
                                         {editData.avatar_url ? <img src={editData.avatar_url} className="w-full h-full object-cover" /> : <div className="p-6 text-[#8a8272]"><ProfileIcon /></div>}
                                    </div>
                                    <div className="flex-grow">
                                         <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            className="w-full bg-white border border-[#e3d8c1] p-3 rounded-2xl text-sm text-[#6b6357] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-[#1a1a1a] file:text-white active:file:bg-[#333] cursor-pointer"
                                         />
                                            <p className="mt-3 text-xs text-[#8a8272] uppercase tracking-widest leading-relaxed">Upload artist persona (JPG/PNG). Used as reference for session art. Max 512px. {(profile?.tier || '').toLowerCase() === 'skool' ? 'Free for Members.' : `Cost: ${COSTS.CREATE_AVATAR} credits.`}</p>
                                        </div>
                                    </div>
                                </div>

                             <div className="col-span-2">
                                <label className="block text-sm font-black uppercase tracking-widest text-[#8a8272] mb-3">Preferred Art Style</label>
                                <select
                                    value={editData.preferred_art_style}
                                    onChange={e => setEditData({...editData, preferred_art_style: e.target.value})}
                                    className="w-full bg-white border border-[#e3d8c1] p-4 rounded-2xl text-[#1a1a1a] text-base outline-none focus:border-[#2b5be0] transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Select a visual style</option>
                                    {ART_STYLES.map(style => (
                                        <option key={style} value={style}>{style}</option>
                                    ))}
                                </select>
                             </div>

                             <div className="col-span-2">
                                <label className="block text-sm font-black uppercase tracking-widest text-[#8a8272] mb-3">Musical Vibe / Style</label>
                                <input type="text" value={editData.preferred_vibe} onChange={e => setEditData({...editData, preferred_vibe: e.target.value})} className="w-full bg-white border border-[#e3d8c1] p-4 rounded-2xl text-[#1a1a1a] text-base outline-none focus:border-[#2b5be0] transition-all" />
                             </div>
                             <div className="col-span-2">
                                <label className="block text-sm font-black uppercase tracking-widest text-[#8a8272] mb-3">Bio / Manifesto</label>
                                <textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} className="w-full h-32 bg-white border border-[#e3d8c1] p-4 rounded-2xl text-[#1a1a1a] text-base outline-none focus:border-[#2b5be0] transition-all resize-none" />
                             </div>
                        </div>

                        <div className="pt-6 flex items-center gap-4">
                            <button onClick={handleSaveProfile} disabled={isSavingProfile} style={{ background: 'linear-gradient(150deg,#3f78ff,#2b5be0 55%,#6a3cf0)' }} className="px-10 py-5 rounded-2xl text-white font-black uppercase tracking-widest text-base active:scale-[0.98] transition-all shadow-lg min-h-[56px] flex items-center justify-center min-w-[200px]">
                                {isSavingProfile ? <LoadingSpinner /> : 'Save Changes'}
                            </button>
                        </div>

                        <div className="mt-12 pt-12 border-t border-[#eadfca]">
                             <h3 className="text-red-600 font-bold mb-4 uppercase text-sm tracking-widest">Danger Zone</h3>
                             <button onClick={handleDeleteAccount} className="border border-red-200 bg-red-50 text-red-600 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest active:bg-red-100">Delete Account</button>
                        </div>
                    </div>
                </div>
            )}

            {/* WALLET TAB */}
            {activeTab === 'wallet' && (
                <div className="animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                        <div>
                            <h2 className="text-3xl font-black text-[#1a1a1a] tracking-tighter mb-2">Billing & Credits</h2>
                            <p className="text-[#6b6357] text-base">Manage your studio currency and view transaction history.</p>
                        </div>
                        <button onClick={onBuyCredits} style={{ background: 'linear-gradient(150deg,#3f78ff,#2b5be0 55%,#6a3cf0)' }} className="text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-base active:scale-105 transition-all shadow-lg">Add Credits</button>
                    </div>

                    <div className="bg-white border border-[#e7ddc9] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 mb-12 flex items-center justify-between relative overflow-hidden gap-4 shadow-sm">
                        <div className="relative z-10">
                            <span className="text-sm font-black uppercase tracking-[0.2em] text-[#8a8272] block mb-2">Current Balance</span>
                            <span className="text-5xl md:text-7xl font-black text-[#1a1a1a] tracking-tighter block mb-4">{formatCredits(profile?.credits)}</span>

                            {nextRefillDate && (
                                <div className="flex flex-col gap-1 mt-2">
                                     <span className="text-sm text-[#6b6357] font-bold uppercase tracking-widest">
                                        Next Monthly Reset: <span className="text-[#2b5be0]">{nextRefillDate}</span>
                                     </span>
                                     <span className="text-[10px] text-[#8a8272] uppercase tracking-widest">
                                        (Free balance resets to 30 monthly. Pro monthly grants 2,000 on renewal.)
                                     </span>
                                </div>
                            )}
                        </div>
                        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-[#e7edff] to-transparent pointer-events-none"></div>
                        <div className="relative z-10 hidden md:block text-[#2b5be0]">
                            <WalletIcon />
                        </div>
                    </div>

                    <h3 className="text-xl font-black text-[#1a1a1a] mb-6">Transaction History</h3>
                    <div className="bg-white border border-[#e7ddc9] rounded-3xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] text-left">
                            <thead className="bg-[#f1ece0] border-b border-[#eadfca]">
                                <tr>
                                    <th className="p-6 text-sm font-black uppercase tracking-widest text-[#8a8272]">Date</th>
                                    <th className="p-6 text-sm font-black uppercase tracking-widest text-[#8a8272]">Item</th>
                                    <th className="p-6 text-sm font-black uppercase tracking-widest text-[#8a8272]">Credits</th>
                                    <th className="p-6 text-sm font-black uppercase tracking-widest text-[#8a8272] text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eadfca]">
                                {transactions.length > 0 ? transactions.map(tx => (
                                    <tr key={tx.id} className="active:bg-[#faf7f0] transition-colors">
                                        <td className="p-6 text-[#6b6357] text-sm font-mono">{new Date(tx.date).toLocaleDateString()}</td>
                                        <td className="p-6 text-[#1a1a1a] font-bold text-base">{tx.item}</td>
                                        <td className="p-6 text-[#2b5be0] font-bold text-sm">+{tx.credits}</td>
                                        <td className="p-6 text-[#1a1a1a] font-bold text-base text-right">${tx.amount.toFixed(2)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="p-10 text-center text-[#8a8272] text-sm">No transactions found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        </div>
                    </div>
                </div>
            )}

            {/* HISTORY TAB — hairline discography rows, not glass cards. */}
            {activeTab === 'history' && (
                <div className="animate-fade-in">
                    <h2 className="text-3xl font-black text-[#1a1a1a] tracking-tighter mb-6">Discography</h2>
                    {songs.length > 0 ? (
                        <div className="rounded-2xl border border-[#e7ddc9] divide-y divide-[#eadfca] overflow-hidden bg-white shadow-sm">
                            {songs.map(song => (
                                <div key={song.id} className="group flex items-center justify-between gap-4 p-4 md:p-5 active:bg-[#faf7f0] transition-all">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-14 h-14 bg-[#efe7d7] rounded-xl flex-shrink-0 overflow-hidden">
                                            {song.album_art ? <img src={song.album_art} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#8a8272]"><ImageIcon /></div>}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-base font-bold text-[#1a1a1a] truncate">{song.title}</h4>
                                            <p className="text-xs text-[#6b6357] truncate max-w-md">{song.lyrics.slice(0, 70)}...</p>
                                            <span className="text-[11px] text-[#8a8272] uppercase tracking-widest mt-1 block">{new Date(song.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => onLoadSong(song)} className="px-4 py-2.5 rounded-xl bg-[#1a1a1a] text-white text-xs font-black uppercase tracking-widest active:scale-95 transition-all">Open</button>
                                        <button onClick={() => handleDeleteSong(song.id)} className="p-2.5 rounded-xl border border-[#e7ddc9] text-[#8a8272] active:text-red-500 active:border-red-200 transition-all"><TrashIcon /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-[#6b6357] text-sm flex flex-col items-center gap-3">
                            <Rudy size={110} variant="art" className="mx-auto mb-4" />
                            No spirits in your discography yet — write one and I'll haunt it for you.
                        </div>
                    )}
                </div>
            )}

        </div>
    </div>
  );
};

export default ProfileView;
