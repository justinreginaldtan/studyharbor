import { AnimatePresence, motion } from "framer-motion";
import { X, Settings, Users, Info, Clock, Coffee, Droplets, UserCircle, LayoutGrid, Palette, LogOut, Mail, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { COZY_AVATAR_COLORS } from "@/lib/utils";
import { authService } from "@/lib/auth/authService";
import type { User } from "@supabase/supabase-js";
import { getPlanLabel, isPro } from "@/lib/features/featureGate";
import { events } from "@/lib/analytics/events";

// Props for the Players tab
type Participant = {
  id: string;
  name: string;
  color: string;
  isSelf?: boolean;
  isFocusing?: boolean;
};

// Combined props for the entire menu
type CornerstoneMenuProps = {
  open: boolean;
  onClose: () => void;
  // Settings props
  ambientVolume: number;
  onAmbientVolumeChange: (value: number) => void;
  focusSessionMinutes: number;
  onFocusSessionChange: (minutes: number) => void;
  breakSessionMinutes: number;
  onBreakSessionChange: (minutes: number) => void;
  // Players props
  participants: Participant[];
  // About props
  onlineCount: number;
  displayName: string;
  // Avatar props
  initialName: string;
  initialColor: string;
  onConfirm: (identity: { displayName: string; color: string }) => void;
  // Auth props
  user: User | null;
  toggleAuthModal: (isOpen: boolean) => void;
  subscriptionStatus: string;
};

const COLOR_NAMES: Record<string, string> = {
  "#FDE68A": "Sun Glow",
  "#FCA5A5": "Dusk Rose",
  "#BFDBFE": "Sky Mist",
  "#C4B5FD": "Twilight Lilac",
  "#BBF7D0": "Fern Whisper",
  "#FBCFE8": "Petal Haze",
  "#FDBA74": "Amber Ember",
  "#A5F3FC": "Lagoon Drift",
};

// Avatar Tab Content
function AvatarContent({ initialName, initialColor, onConfirm, onClose }: Omit<CornerstoneMenuProps, 'open' | 'user' | 'toggleAuthModal'>) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  useEffect(() => {
    setColor(initialColor);
  }, [initialColor]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm({ displayName: trimmed, color });
    onClose(); // Close menu on save
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-4">
        <h3 className="text-lg font-semibold text-parchment mb-4">Your Appearance</h3>
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-left text-xs uppercase tracking-[0.28em] text-slate-200/70">
              Display Name
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Soft Birch"
              className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-300/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
              maxLength={40}
            />
          </div>
          <fieldset className="space-y-3 text-left">
            <legend className="text-xs uppercase tracking-[0.28em] text-slate-200/70">
              Avatar Glow
            </legend>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {COZY_AVATAR_COLORS.map((option) => {
                const selected = option === color;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setColor(option)}
                    className={`group relative flex h-16 flex-col items-center justify-center rounded-2xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                      selected
                        ? "border-white/60 bg-white/10"
                        : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
                    }`}
                    aria-pressed={selected}
                  >
                    <span
                      className="mb-1 h-6 w-6 rounded-full"
                      style={{ backgroundColor: option }}
                    />
                    <span className="text-[0.65rem] font-medium tracking-[0.15em] text-slate-100/80">
                      {COLOR_NAMES[option] ?? "Glow"}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </div>
      <footer className="mt-6 flex-shrink-0">
        <button
          type="button"
          onClick={handleSave}
          disabled={name.trim().length === 0}
          className="w-full rounded-full bg-twilight-ember/90 px-6 py-3 text-sm font-semibold text-twilight shadow-[0_18px_36px_rgba(252,211,77,0.45)] transition hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-twilight-ember/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save Changes
        </button>
      </footer>
    </div>
  );
}

// About Tab Content
function AboutContent({ onlineCount, displayName }: { onlineCount: number; displayName: string }) {
  return (
    <div className="text-slate-300/90 leading-relaxed">
      <h3 className="text-lg font-semibold text-parchment">StudyHarbor 🌙</h3>
      <p className="mt-4 text-sm" style={{ lineHeight: 1.7 }}>
        A quiet space to study together.
        <br />
        Just you, soft music, and gentle company.
      </p>
      <p className="mt-4 text-xs tracking-[0.18em] text-slate-300/70">
        {onlineCount === 1
          ? "Just you for now"
          : `${onlineCount - 1} ${onlineCount === 2 ? "other is" : "others are"} focusing nearby`}
      </p>
      <p className="mt-8 text-sm">
        Hey there, {displayName} · Tap anywhere to wander 🌙
      </p>
    </div>
  );
}

// Players Tab Content
function PlayersContent({ participants, onlineCount }: { participants: Participant[], onlineCount: number }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-parchment">
          {participants.length === 1 ? "Just you for now" : "In the lounge together"}
        </h3>
        <p className="text-xs text-slate-300/70">{onlineCount} {onlineCount === 1 ? 'person' : 'people'} online</p>
      </div>
      <ul className="space-y-3">
        {participants.map((participant) => (
          <li
            key={participant.id}
            className="group relative flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100/90 transition duration-150 hover:border-white/20 hover:bg-white/10"
          >
            <div className="flex items-center gap-4">
              <span
                className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-slate-800/80"
              >
                <span
                  className="absolute inset-0 opacity-50 blur-md"
                  style={{ backgroundColor: participant.color }}
                />
                <span
                  className="relative h-3 w-3 rounded-full"
                  style={{ background: participant.color }}
                />
              </span>
              <div className="flex flex-col">
                <span className="font-medium text-slate-100">
                  {participant.name}
                  {participant.isSelf && (
                    <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.18em] text-slate-200">
                      You
                    </span>
                  )}
                </span>
                <span className="text-xs uppercase tracking-[0.24em] text-slate-300/70">
                  {participant.isFocusing ? "Focusing" : "Drifting"}
                </span>
              </div>
            </div>
            <motion.span
              className="h-2 w-2 rounded-full shadow-[0_0_12px_rgba(252,211,119,0.55)]"
              style={{
                background: participant.isFocusing ? "#E8C877" : "#94a3b8",
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

// Settings Tab Content
function SettingsContent(props: Omit<CornerstoneMenuProps, 'open' | 'onClose' | 'participants' | 'onlineCount' | 'displayName' | 'initialName' | 'initialColor' | 'onConfirm' | 'user' | 'toggleAuthModal'>) {
  return (
    <div className="h-full overflow-y-auto pr-4 text-sm">
      <section className="space-y-4">
        <p className="text-[0.64rem] uppercase tracking-[0.24em] text-slate-300/70">Ambient Volume</p>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-xs text-slate-300/80">
            <span className="inline-flex items-center gap-2 uppercase tracking-[0.22em]">
              <Droplets className="h-3.5 w-3.5" />
              Ambient
            </span>
            <span>{Math.round(props.ambientVolume * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.01} value={props.ambientVolume}
            onChange={(e) => props.onAmbientVolumeChange(Number(e.target.value))}
            className="mt-4 w-full accent-[#E8C877]"
          />
        </div>
      </section>
      <section className="mt-8 space-y-4">
        <p className="text-[0.64rem] uppercase tracking-[0.24em] text-slate-300/70">Focus Time</p>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-xs text-slate-300/80">
            <span className="inline-flex items-center gap-2 uppercase tracking-[0.22em]">
              <Clock className="h-3.5 w-3.5" />
              Focus
            </span>
            <span>{props.focusSessionMinutes} min</span>
          </div>
          <input
            type="range" min={5} max={90} step={5} value={props.focusSessionMinutes}
            onChange={(e) => props.onFocusSessionChange(Number(e.target.value))}
            className="mt-4 w-full accent-[#E8C877]"
          />
        </div>
      </section>
      <section className="mt-6 space-y-4">
        <p className="text-[0.64rem] uppercase tracking-[0.24em] text-slate-300/70">Break Time</p>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-xs text-slate-300/80">
            <span className="inline-flex items-center gap-2 uppercase tracking-[0.22em]">
              <Coffee className="h-3.5 w-3.5" />
              Break
            </span>
            <span>{props.breakSessionMinutes} min</span>
          </div>
          <input
            type="range" min={1} max={30} step={1} value={props.breakSessionMinutes}
            onChange={(e) => props.onBreakSessionChange(Number(e.target.value))}
            className="mt-4 w-full accent-[#E8C877]"
          />
        </div>
      </section>
    </div>
  );
}

// Account Tab Content
function AccountContent({ user, toggleAuthModal, onClose, displayName, subscriptionStatus }: { user: User | null, toggleAuthModal: (isOpen: boolean) => void, onClose: () => void, displayName: string, subscriptionStatus: string }) {
  
  const handleSignOut = async () => {
    await authService.signOut();
    onClose();
  };

  const handleSignIn = () => {
    toggleAuthModal(true);
    onClose();
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-twilight-ember/20 flex items-center justify-center">
            <UserCircle className="w-8 h-8 text-twilight-ember" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-parchment mb-2">You're browsing as a guest</h3>
            <p className="text-sm text-slate-300/70 leading-relaxed">
              Sign in to save your focus sessions, track your progress, and access your data across devices.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-twilight-overlay border border-white/10">
          <h4 className="text-sm font-medium text-parchment mb-2">✨ Benefits of signing in:</h4>
          <ul className="space-y-2 text-sm text-slate-300/80">
            <li className="flex items-start gap-2">
              <span className="text-twilight-ember mt-0.5">•</span>
              <span>Save your focus session history</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-twilight-ember mt-0.5">•</span>
              <span>Track your progress and streaks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-twilight-ember mt-0.5">•</span>
              <span>Access from any device</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-twilight-ember mt-0.5">•</span>
              <span>Unlock pro features (coming soon)</span>
            </li>
          </ul>
        </div>

        <button
          onClick={handleSignIn}
          className="w-full rounded-full bg-twilight-ember/90 px-6 py-3 text-sm font-semibold text-twilight shadow-[0_18px_36px_rgba(252,211,77,0.45)] transition hover:scale-[1.02] active:scale-[0.98]"
        >
          Sign In / Sign Up
        </button>
      </div>
    );
  }

  // Authenticated user view
  const userEmail = user.email || '';
  const userName = displayName;
  const planLabel = getPlanLabel(subscriptionStatus);
  const isProStatus = isPro(subscriptionStatus);
  const [billingLoading, setBillingLoading] = useState(false);

  const handleManageBilling = async () => {
    try {
      setBillingLoading(true);
      events.billingPortalOpened();
      const response = await fetch("/api/billing/portal", { method: "POST" });
      if (!response.ok) {
        throw new Error("Unable to open billing portal");
      }
      const payload = await response.json();
      if (payload?.url) {
        window.location.href = payload.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <div className="p-6 rounded-glass bg-glass-surface border border-glass-border">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-twilight-ember flex items-center justify-center text-lg font-bold text-twilight">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-parchment mb-1">{userName}</h3>
            <p className="text-sm text-slate-300/70 truncate flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              {userEmail}
            </p>
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="p-4 rounded-lg bg-twilight-overlay border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wider text-slate-300/70">Account Status</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isProStatus ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
            {planLabel}
          </span>
        </div>
        <p className="text-sm text-slate-300/80">
          You're signed in and your sessions are being saved.
          {!isProStatus && (
            <span> Upgrade to Pro for more features!</span>
          )}
        </p>
      </div>

      {/* Quick Stats (placeholder) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-lg bg-twilight-overlay border border-white/10 text-center">
          <div className="text-2xl font-bold text-twilight-ember mb-1">—</div>
          <div className="text-xs text-slate-300/70">Focus Sessions</div>
        </div>
        <div className="p-4 rounded-lg bg-twilight-overlay border border-white/10 text-center">
          <div className="text-2xl font-bold text-twilight-lagoon mb-1">—</div>
          <div className="text-xs text-slate-300/70">Total Minutes</div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-4 border-t border-white/10">
        <button
          onClick={handleManageBilling}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-twilight-ember/20 text-twilight-ember hover:bg-twilight-ember/30 transition-colors disabled:opacity-60"
          disabled={billingLoading}
        >
          <DollarSign className="w-4 h-4" />
          <span className="text-sm font-medium">{billingLoading ? "Opening billing..." : "Manage Billing"}</span>
        </button>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-twilight-blush/20 text-twilight-blush hover:bg-twilight-blush/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>

        <p className="text-center text-xs text-slate-300/50">
          Signing out will return you to a guest session.
        </p>
      </div>
    </div>
  );
}

export function CornerstoneMenu(props: CornerstoneMenuProps) {
  const [activeTab, setActiveTab] = useState("players");
  const router = useRouter(); // Initialize useRouter

  const handleTabClick = (tabName: string) => {
    if (tabName === "pricing") {
      router.push('/pricing');
      props.onClose(); // Close menu when navigating
    } else {
      setActiveTab(tabName);
    }
  };

  return (
    <AnimatePresence>
      {props.open && (
        <motion.div
          key="cornerstone-menu"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 backdrop-blur-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={props.onClose}
        >
          <motion.div
            className="relative flex h-[min(600px,90vh)] w-[min(800px,94vw)] flex-col rounded-glass border border-white/10 bg-slate-900/60 shadow-glass-lg"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleTabClick("players")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${activeTab === "players" ? "bg-white/10 text-white" : "text-slate-300/70 hover:bg-white/5"}`}>
                  <Users className="h-4 w-4" />
                  <span>Players</span>
                </button>
                <button
                  onClick={() => handleTabClick("avatar")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${activeTab === "avatar" ? "bg-white/10 text-white" : "text-slate-300/70 hover:bg-white/5"}`}>
                  <Palette className="h-4 w-4" />
                  <span>Avatar</span>
                </button>
                <button
                  onClick={() => handleTabClick("account")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${activeTab === "account" ? "bg-white/10 text-white" : "text-slate-300/70 hover:bg-white/5"}`}>
                  <UserCircle className="h-4 w-4" />
                  <span>Account</span>
                </button>
                <button
                  onClick={() => handleTabClick("pricing")} // New Pricing Button
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${activeTab === "pricing" ? "bg-white/10 text-white" : "text-slate-300/70 hover:bg-white/5"}`}>
                  <DollarSign className="h-4 w-4" />
                  <span>Pricing</span>
                </button>
                <button
                  onClick={() => handleTabClick("lobbies")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${activeTab === "lobbies" ? "bg-white/10 text-white" : "text-slate-300/70 hover:bg-white/5"}`}>
                  <LayoutGrid className="h-4 w-4" />
                  <span>Lobbies</span>
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${activeTab === "settings" ? "bg-white/10 text-white" : "text-slate-300/70 hover:bg-white/5"}`}>
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => setActiveTab("about")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${activeTab === "about" ? "bg-white/10 text-white" : "text-slate-300/70 hover:bg-white/5"}`}>
                  <Info className="h-4 w-4" />
                  <span>About</span>
                </button>
              </div>
              <button
                onClick={props.onClose}
                className="rounded-full p-2 text-slate-300/70 transition hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </header>

            <main className="flex-1 overflow-hidden p-6">
              {activeTab === "players" && <PlayersContent participants={props.participants} onlineCount={props.onlineCount} />}
              {activeTab === "avatar" && <AvatarContent {...props} />}
              {activeTab === "account" && <AccountContent user={props.user} toggleAuthModal={props.toggleAuthModal} onClose={props.onClose} displayName={props.displayName} subscriptionStatus={props.subscriptionStatus} />}
              {activeTab === "pricing" && <PricingContent onClose={props.onClose} />}
              {activeTab === "lobbies" && <div className="text-slate-400">Lobby switching coming soon.</div>}
              {activeTab === "about" && <AboutContent onlineCount={props.onlineCount} displayName={props.displayName} />}
              {activeTab === "settings" && <SettingsContent {...props} />}
            </main>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PricingContent({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  const handleGoToPricing = () => {
    router.push('/pricing');
    onClose();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 text-parchment">
      <h3 className="text-xl font-bold">Manage Your Plan</h3>
      <p className="text-text-muted">View pricing options and upgrade.</p>
      <button
        onClick={handleGoToPricing}
        className="rounded-full bg-twilight-ember/90 px-6 py-3 text-sm font-semibold text-twilight shadow-[0_18px_36px_rgba(252,211,77,0.45)] transition hover:scale-[1.02] active:scale-[0.98]"
      >
        Go to Pricing Page
      </button>
    </div>
  );
}
