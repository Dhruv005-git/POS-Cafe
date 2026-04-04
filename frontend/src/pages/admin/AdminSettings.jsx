import { Settings, Info } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-100">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">System configuration</p>
      </div>

      <div className="max-w-xl space-y-4">
        {/* Tax Rate */}
        <div className="bg-dark-800 border border-slate-700/40 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center">
              <Settings className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-200">General Settings</h2>
              <p className="text-xs text-slate-500">Manage your café configuration</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Tax Rate (%)</label>
              <input className="input" type="number" defaultValue={5} min={0} max={100} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Café Name</label>
              <input className="input" defaultValue="POS Cafe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Currency Symbol</label>
              <input className="input" defaultValue="$" />
            </div>
          </div>
        </div>

        <div className="bg-dark-800 border border-slate-700/40 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-300 mb-1">System Info</p>
              <div className="text-xs text-slate-500 space-y-1">
                <p>Version: 1.0.0</p>
                <p>Stack: MERN + Socket.io</p>
                <p>Roles: Admin · Staff · Kitchen · Customer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
