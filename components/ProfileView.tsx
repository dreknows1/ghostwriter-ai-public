
import React, { useState, useEffect } from 'react';
import { UserProfile, SavedSong, Transaction } from '../types';
import { getUserProfile, upsertUserProfile, deleteUserProfile, getUserTransactions } from '../services/userService';
import { getSavedSongs, deleteSong, deleteAllUserSongs } from '../services/songService';
import { COSTS, deductCredits, hasEnoughCredits } from '../services/creditService';
import { 
    LoadingSpinner, ProfileIcon, TrashIcon, EditIcon, ImageIcon, 
    HomeIcon, WalletIcon, ClockIcon, LogoutIcon 
} from './icons';

interface ProfileViewProps {
  email: string;
  onLoadSong: (song: SavedSong) => void;
  onBack: () => void;
  onSignOut: () => void;
  onProfileUpdate?: (updated: UserProfile) => void;
  onBuyCredits: () => void;
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

const ProfileView: React.FC<ProfileViewProps> = ({ email, onLoadSong, onBack, onSignOut, onProfileUpdate, onBuyCredits }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
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
        const [p, s, t] = await Promise.all([
          getUserProfile(email),
          getSavedSongs(email),
          getUserTransactions(email)
        ]);
        
        setProfile(p);
        setSongs(s || []);
        setTransactions(t || []);
        
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
      
      // Map back from the result to ensure internal state is clean
      const finalUpdated: UserProfile = result.data ? {
          ...updatedProfilePayload,
          id: result.data.id || updatedProfilePayload.id,
          credits: result.data.credits ?? updatedProfilePayload.credits,
          // Ensure we normalize the database email back to our user_email prop
          user_email: (result.data as any).email || updatedProfilePayload.user_email
      } : updatedProfilePayload;

      setProfile(finalUpdated);
      if (onProfileUpdate) onProfileUpdate(finalUpdated);
      alert("Profile updated successfully.");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save profile.");
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
                    const canAfford = await hasEnoughCredits(email, COSTS.CREATE_AVATAR);
                    if (!canAfford) {
                        alert(`Insufficient credits. Creating an avatar costs ${COSTS.CREATE_AVATAR} credits.`);
                        onBuyCredits();
                        return;
                    }
                    await deductCredits(email, COSTS.CREATE_AVATAR);
                    setEditData(prev => ({...prev, avatar_url: dataUrl}));
                    alert(`Avatar created. ${COSTS.CREATE_AVATAR} credits used.`);
                }
            }
            img.src = readerEvent.target?.result as string;
        }
        reader.readAsDataURL(file);
    }
  };

  const handleDeleteSong = async (id: string) => {
    if (confirm("Permanently delete this song record?")) {
      await deleteSong(id, email);
      setSongs(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleDeleteAccount = async () => {
      if(confirm("WARNING: This will permanently delete your account, credits, and all songs. This action cannot be undone.")) {
          try {
              await deleteAllUserSongs(email);
              await deleteUserProfile(email);
              onSignOut();
          } catch(e) {
              alert("Error deleting account.");
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
      <span className="mt-4 text-sm font-black uppercase tracking-[0.3em] text-slate-500">Loading Account Data...</span>
    </div>
  );

  const NavItem = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all mb-2 ${activeTab === id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}
      >
          <Icon />
          <span className="text-sm font-black uppercase tracking-[0.2em]">{label}</span>
      </button>
  );

  return (
    <div className="max-w-7xl mx-auto pt-6 md:pt-8 pb-20 px-4 animate-fade-in flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
            <button onClick={onBack} className="mb-8 text-slate-500 hover:text-white transition-all font-black text-sm uppercase tracking-widest flex items-center gap-2 group">
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Studio
            </button>
            
            <div className="glass-panel rounded-[1.5rem] md:rounded-[2rem] p-4 flex flex-col">
                <div className="px-4 py-6 mb-4 border-b border-slate-800/50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0">
                         {editData.avatar_url ? <img src={editData.avatar_url} className="w-full h-full object-cover" /> : <div className="p-3 text-slate-500"><ProfileIcon /></div>}
                    </div>
                    <div className="overflow-hidden">
                        <h3 className="text-white font-bold text-base truncate">{editData.display_name || 'User'}</h3>
                        <p className="text-xs text-slate-500 truncate">{email}</p>
                    </div>
                </div>

                <NavItem id="overview" icon={HomeIcon} label="Dashboard" />
                <NavItem id="profile" icon={ProfileIcon} label="Profile Details" />
                <NavItem id="wallet" icon={WalletIcon} label="Billing & Credits" />
                <NavItem id="history" icon={ClockIcon} label="Studio History" />
                
                <div className="mt-8 pt-4 border-t border-slate-800/50">
                    <button onClick={onSignOut} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-900/10 transition-all">
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
                        <h2 className="heading-display text-3xl md:text-4xl font-black text-white tracking-tighter mb-2">Welcome back, {profile?.display_name?.split(' ')[0] || 'Artist'}.</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Here is what's happening in your studio today.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="glass-panel bg-gradient-to-br from-blue-900/35 to-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-8 relative overflow-hidden">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400 mb-4">Available Credits</h3>
                            <div className="text-5xl md:text-6xl font-black text-white mb-2">{profile?.credits || 0}</div>
                            
                            {nextRefillDate && (
                                <div className="mb-4 inline-block px-3 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                     <span className="text-xs text-blue-300 font-bold uppercase tracking-wider">Next Refill: {nextRefillDate}</span>
                                </div>
                            )}

                            <button onClick={onBuyCredits} className="mt-2 w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all shadow-lg">Add Credits</button>
                            <p className="mt-4 text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed opacity-60">
                                *Free tier: 30/mo. Pro plan: 2,000/mo. Credit packs are one-time.
                            </p>
                        </div>

                        <div className="glass-panel rounded-[2rem] md:rounded-[2.5rem] p-8">
                             <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Total Sessions</h3>
                             <div className="text-5xl md:text-6xl font-black text-white mb-2">{songs.length}</div>
                             <p className="text-slate-600 text-sm">Mastered tracks in catalog</p>
                        </div>

                        <div className="glass-panel rounded-[2rem] md:rounded-[2.5rem] p-8">
                             <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Membership Status</h3>
                             <div className="text-2xl font-black text-white mb-2 uppercase">{planState.plan}</div>
                             <p className={`text-sm font-bold uppercase tracking-widest ${planState.isActive ? 'text-emerald-500' : 'text-amber-400'}`}>
                               ● {planState.isActive ? 'Active' : 'Inactive'}
                             </p>
                             {planState.plan === 'Pro Monthly' && planState.renewalDate && (
                                <p className="mt-2 text-xs text-slate-500 uppercase tracking-widest">
                                  Renewal Date: <span className="text-slate-300">{planState.renewalDate}</span>
                                </p>
                             )}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-6">
                             <h3 className="text-xl font-black text-white tracking-tight">Recent Activity</h3>
                             <button onClick={() => setActiveTab('history')} className="text-sm font-black uppercase tracking-widest text-blue-500 hover:text-white">View All</button>
                        </div>
                        {songs.length > 0 ? (
                            <div className="space-y-4">
                                {songs.slice(0, 3).map(song => (
                                    <div key={song.id} className="glass-panel bg-[#131722]/70 p-6 rounded-3xl flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-slate-600">
                                                {song.album_art ? <img src={song.album_art} className="w-full h-full object-cover rounded-xl" /> : <ImageIcon />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-base">{song.title}</h4>
                                                <p className="text-sm text-slate-500">{new Date(song.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => onLoadSong(song)} className="text-sm font-black uppercase tracking-widest text-slate-500 hover:text-white">Open</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center border border-slate-800 border-dashed rounded-3xl text-slate-600 text-sm">No recent activity.</div>
                        )}
                    </div>
                </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
                <div className="animate-fade-in max-w-2xl">
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-8">Profile Settings</h2>
                    
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                             <div className="col-span-2">
                                <label className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-3">Display Name</label>
                                <input type="text" value={editData.display_name} onChange={e => setEditData({...editData, display_name: e.target.value})} className="w-full bg-[#131722] border border-slate-800 p-4 rounded-2xl text-white text-base outline-none focus:border-blue-500 transition-all" />
                             </div>
                             
                             {/* AVATAR UPLOAD SECTION */}
                             <div className="col-span-2">
                                <label className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-3">Avatar Image</label>
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0">
                                         {editData.avatar_url ? <img src={editData.avatar_url} className="w-full h-full object-cover" /> : <div className="p-6 text-slate-500"><ProfileIcon /></div>}
                                    </div>
                                    <div className="flex-grow">
                                         <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            className="w-full bg-[#131722] border border-slate-800 p-3 rounded-2xl text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
                                         />
                                            <p className="mt-3 text-xs text-slate-500 uppercase tracking-widest leading-relaxed">Upload artist persona (JPG/PNG). Used as reference for session art. Max 512px. Cost: {COSTS.CREATE_AVATAR} credits.</p>
                                        </div>
                                    </div>
                                </div>

                             <div className="col-span-2">
                                <label className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-3">Preferred Art Style</label>
                                <select 
                                    value={editData.preferred_art_style} 
                                    onChange={e => setEditData({...editData, preferred_art_style: e.target.value})}
                                    className="w-full bg-[#131722] border border-slate-800 p-4 rounded-2xl text-white text-base outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Select a visual style</option>
                                    {ART_STYLES.map(style => (
                                        <option key={style} value={style}>{style}</option>
                                    ))}
                                </select>
                             </div>

                             <div className="col-span-2">
                                <label className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-3">Musical Vibe / Style</label>
                                <input type="text" value={editData.preferred_vibe} onChange={e => setEditData({...editData, preferred_vibe: e.target.value})} className="w-full bg-[#131722] border border-slate-800 p-4 rounded-2xl text-white text-base outline-none focus:border-blue-500 transition-all" />
                             </div>
                             <div className="col-span-2">
                                <label className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-3">Bio / Manifesto</label>
                                <textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} className="w-full h-32 bg-[#131722] border border-slate-800 p-4 rounded-2xl text-white text-base outline-none focus:border-blue-500 transition-all resize-none" />
                             </div>
                        </div>

                        <div className="pt-6 flex items-center gap-4">
                            <button onClick={handleSaveProfile} disabled={isSavingProfile} className="bg-blue-600 px-10 py-5 rounded-2xl text-white font-black uppercase tracking-widest text-base hover:bg-blue-500 transition-all shadow-lg min-h-[56px] flex items-center justify-center min-w-[200px]">
                                {isSavingProfile ? <LoadingSpinner /> : 'Save Changes'}
                            </button>
                        </div>
                        
                        <div className="mt-12 pt-12 border-t border-slate-800/50">
                             <h3 className="text-red-500 font-bold mb-4 uppercase text-sm tracking-widest">Danger Zone</h3>
                             <button onClick={handleDeleteAccount} className="border border-red-900/30 bg-red-900/10 text-red-500 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-red-900/20">Delete Account</button>
                        </div>
                    </div>
                </div>
            )}

            {/* WALLET TAB */}
            {activeTab === 'wallet' && (
                <div className="animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Billing & Credits</h2>
                            <p className="text-slate-500 text-base">Manage your studio currency and view transaction history.</p>
                        </div>
                        <button onClick={onBuyCredits} className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-base hover:scale-105 transition-all shadow-xl">Add Credits</button>
                    </div>

                    <div className="bg-[#131722] border border-slate-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 mb-12 flex items-center justify-between relative overflow-hidden gap-4">
                        <div className="relative z-10">
                            <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 block mb-2">Current Balance</span>
                            <span className="text-5xl md:text-7xl font-black text-white tracking-tighter block mb-4">{profile?.credits}</span>
                            
                            {nextRefillDate && (
                                <div className="flex flex-col gap-1 mt-2">
                                     <span className="text-sm text-slate-500 font-bold uppercase tracking-widest">
                                        Next Monthly Reset: <span className="text-blue-400">{nextRefillDate}</span>
                                     </span>
                                     <span className="text-[10px] text-slate-600 uppercase tracking-widest">
                                        (Free balance resets to 30 monthly. Pro monthly grants 2,000 on renewal.)
                                     </span>
                                </div>
                            )}
                        </div>
                        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-blue-900/20 to-transparent pointer-events-none"></div>
                        <div className="relative z-10 hidden md:block">
                            <WalletIcon />
                        </div>
                    </div>

                    <h3 className="text-xl font-black text-white mb-6">Transaction History</h3>
                    <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl overflow-hidden">
                        <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] text-left">
                            <thead className="bg-slate-900/50 border-b border-slate-800">
                                <tr>
                                    <th className="p-6 text-sm font-black uppercase tracking-widest text-slate-500">Date</th>
                                    <th className="p-6 text-sm font-black uppercase tracking-widest text-slate-500">Item</th>
                                    <th className="p-6 text-sm font-black uppercase tracking-widest text-slate-500">Credits</th>
                                    <th className="p-6 text-sm font-black uppercase tracking-widest text-slate-500 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {transactions.length > 0 ? transactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-slate-900/30 transition-colors">
                                        <td className="p-6 text-slate-400 text-sm font-mono">{new Date(tx.date).toLocaleDateString()}</td>
                                        <td className="p-6 text-white font-bold text-base">{tx.item}</td>
                                        <td className="p-6 text-cyan-400 font-bold text-sm">+{tx.credits}</td>
                                        <td className="p-6 text-slate-300 font-bold text-base text-right">${tx.amount.toFixed(2)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="p-10 text-center text-slate-600 text-sm">No transactions found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        </div>
                    </div>
                </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
                <div className="animate-fade-in">
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-8">Studio History</h2>
                    <div className="grid grid-cols-1 gap-6">
                        {songs.length > 0 ? songs.map(song => (
                             <div key={song.id} className="group bg-[#0b0f19] border border-slate-800 p-4 md:p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 hover:border-blue-500/30 transition-all">
                                 <div className="flex items-center gap-6">
                                     <div className="w-20 h-20 bg-slate-800 rounded-2xl flex-shrink-0 overflow-hidden">
                                         {song.album_art ? <img src={song.album_art} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-600"><ImageIcon /></div>}
                                     </div>
                                     <div>
                                        <h4 className="text-lg md:text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{song.title}</h4>
                                         <p className="text-sm text-slate-500 font-mono line-clamp-1 max-w-md">{song.lyrics.slice(0, 70)}...</p>
                                         <span className="text-xs text-slate-600 uppercase tracking-widest mt-2 block">{new Date(song.created_at).toLocaleDateString()}</span>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-3 w-full md:w-auto">
                                     <button onClick={() => onLoadSong(song)} className="flex-grow md:flex-none px-8 py-4 rounded-xl bg-white text-black text-sm font-black uppercase tracking-widest hover:scale-105 transition-all">Open Record</button>
                                     <button onClick={() => handleDeleteSong(song.id)} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-500 hover:border-red-900 transition-all"><TrashIcon /></button>
                                 </div>
                             </div>
                        )) : (
                            <div className="text-center py-20 text-slate-500 text-base">No history available.</div>
                        )}
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};

export default ProfileView;
