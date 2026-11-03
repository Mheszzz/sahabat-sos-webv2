import { useState, useRef, useEffect } from 'react';
import {
  Save, User, Shield, Camera, Loader2,
  CheckCircle, XCircle, Eye, EyeOff, Phone, MapPin, Mail, Lock,
} from 'lucide-react';
import { useAdminProfile } from '../../hooks/pengaturan/useAdminProfile';
import { resolveStorageUrl } from '../../utils/theme';


// Badge Role
function RoleBadge({ role }) {
  const map = {
    superadmin: { label: 'Superadmin', bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
    admin:      { label: 'Admin',      bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  };
  const cfg = map[role] ?? { label: role ?? '-', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// Profile Avatar Component
function ProfileAvatar({
  fotoPreview,
  name,
  onPickFile,
  onDelete,
  isDeletingFoto,
  fotoInputRef,
  handleFotoChange,
  hasFoto,
  hasPendingFoto,
  onCancelPick,
}) {
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const [imgError, setImgError] = useState(false);
  const resolvedPreview = resolveStorageUrl(fotoPreview);

  useEffect(() => {
    setImgError(false);
  }, [resolvedPreview]);

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative group">
        <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-md ring-2 ring-[#e2e8f0] bg-slate-100 flex items-center justify-center">
          {resolvedPreview && !imgError ? (
            <img
              src={resolvedPreview}
              alt="Foto Profil"
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-3xl font-bold text-slate-400">{initials}</span>
          )}
        </div>
        {/* Overlay kamera saat hover */}
        <button
          type="button"
          onClick={onPickFile}
          className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Ganti foto"
        >
          <Camera size={22} className="text-white" />
        </button>
        <input
          ref={fotoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          className="hidden"
          onChange={handleFotoChange}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPickFile}
          className="text-[12px] font-semibold text-[#0b6f61] hover:underline"
        >
          {hasPendingFoto ? 'Pilih Foto Lain' : 'Ganti Foto'}
        </button>
        {hasPendingFoto ? (
          <>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={onCancelPick}
              className="text-[12px] font-semibold text-slate-500 hover:underline"
            >
              Batal
            </button>
          </>
        ) : hasFoto ? (
          <>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeletingFoto}
              className="text-[12px] font-semibold text-red-500 hover:underline disabled:opacity-50"
            >
              {isDeletingFoto ? 'Menghapus...' : 'Hapus'}
            </button>
          </>
        ) : null}
      </div>
      {hasPendingFoto ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 animate-pulse text-center">
          Foto baru belum disimpan (klik tombol di bawah)
        </span>
      ) : (
        <p className="text-[11px] text-slate-400">JPG, PNG, WEBP · Maks 5MB</p>
      )}
    </div>
  );
}

// Field Input
function Field({ label, icon: Icon, error, children }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 uppercase tracking-wide">
        {Icon && <Icon size={12} className="text-slate-400" />}
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, disabled, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="form-input disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
    />
  );
}

// Password Input
function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="form-input pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        tabIndex={-1}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

// Toast
function Toast({ toast }) {
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[12px] font-bold ${
      isSuccess
        ? 'border-[#bbf7d0] bg-[#ecfdf5] text-[#15803d]'
        : 'border-red-200 bg-red-50 text-red-700'
    }`}>
      {isSuccess ? <CheckCircle size={14} /> : <XCircle size={14} />}
      <span>{toast.message}</span>
    </div>
  );
}

// Skeleton Loading
function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-[22px] border border-[#e2e8f0] bg-white p-6">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="h-3 w-28 rounded bg-slate-100" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="h-9 rounded-lg bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function PengaturanPage() {
  const [activeTab, setActiveTab] = useState('profil');
  const {
    profile, isLoading, error,
    formData, setFormData, fotoPreview, fotoFile, hasPendingFoto, fotoInputRef,
    handleFotoChange, handleCancelFoto, handleDeleteFoto, isDeletingFoto,
    handleSubmitProfile, isSavingProfile,
    securityForm, setSecurityForm, handleSubmitSecurity, isSavingSecurity,
    toast, errors,
  } = useAdminProfile();

  const hasFoto = !!(profile?.foto_profile);

  const tabs = [
    { key: 'profil', label: 'Data Diri', icon: User },
    { key: 'keamanan', label: 'Keamanan', icon: Shield },
  ];

  return (
    <div className="page-shell space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.04em] text-slate-900">Pengaturan Profil</h1>
          <p className="mt-1 text-[14px] font-medium text-slate-500">Kelola informasi profil dan akun administrator.</p>
        </div>
        <Toast toast={toast} />
      </div>

      {/* Error global */}
      {error && !isLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          <XCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <>
          {/* Profile Card header */}
          <div className="rounded-[22px] border border-[#e2e8f0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col items-center gap-6 p-6 sm:flex-row">
              <ProfileAvatar
                fotoPreview={fotoPreview}
                name={profile?.name}
                onPickFile={() => fotoInputRef.current?.click()}
                onDelete={handleDeleteFoto}
                isDeletingFoto={isDeletingFoto}
                fotoInputRef={fotoInputRef}
                handleFotoChange={handleFotoChange}
                hasFoto={hasFoto}
                hasPendingFoto={hasPendingFoto}
                onCancelPick={handleCancelFoto}
              />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[20px] font-bold text-slate-900">{profile?.name || '-'}</p>
                <p className="mt-0.5 text-[13px] text-slate-500">{profile?.email || '-'}</p>
                <div className="mt-2">
                  <RoleBadge role={profile?.role} />
                </div>
                {profile?.is_active === false && (
                  <span className="mt-2 inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-600">
                    Non-Aktif
                  </span>
                )}
              </div>
            </div>

            {/* Tab navigation */}
            <div className="border-t border-slate-100 px-6">
              <nav className="flex gap-1 -mb-px">
                {tabs.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-[13px] font-semibold transition-colors ${
                      activeTab === key
                        ? 'border-[#0b6f61] text-[#0b6f61]'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* ── Tab: Data Diri ── */}
          {activeTab === 'profil' && (
            <form onSubmit={handleSubmitProfile} className="rounded-[22px] border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Nama Lengkap" icon={User} error={errors.name}>
                  <TextInput
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nama lengkap"
                  />
                </Field>
                <Field label="Nomor Telepon" icon={Phone} error={errors.no_telp}>
                  <TextInput
                    value={formData.no_telp}
                    onChange={e => setFormData(p => ({ ...p, no_telp: e.target.value }))}
                    placeholder="Contoh: 08123456789"
                  />
                </Field>
                <Field label="Alamat" icon={MapPin} error={errors.alamat} >
                  <TextInput
                    value={formData.alamat}
                    onChange={e => setFormData(p => ({ ...p, alamat: e.target.value }))}
                    placeholder="Alamat lengkap"
                  />
                </Field>
                <Field label="Role" icon={Shield}>
                  <div className="form-input flex items-center bg-slate-50 cursor-not-allowed">
                    <RoleBadge role={profile?.role} />
                  </div>
                </Field>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFormData({ name: profile?.name || '', no_telp: profile?.no_telp || '', alamat: profile?.alamat || '' })}
                  className="btn-base btn-secondary"
                >
                  Batal
                </button>
                <button type="submit" disabled={isSavingProfile} className="btn-base btn-primary h-10 px-6 disabled:opacity-70">
                  {isSavingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ── Tab: Keamanan ── */}
          {activeTab === 'keamanan' && (
            <form onSubmit={handleSubmitSecurity} className="rounded-[22px] border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-5">
              <div className="mb-1">
                <p className="text-[13px] text-slate-500">Isi salah satu atau keduanya. <strong>Password saat ini</strong> wajib diisi untuk konfirmasi.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Email Baru" icon={Mail} error={errors.email}>
                  <TextInput
                    type="email"
                    value={securityForm.email}
                    onChange={e => setSecurityForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="Email baru (opsional)"
                  />
                </Field>
                <Field label="Password Saat Ini" icon={Lock} error={errors.current_password}>
                  <PasswordInput
                    value={securityForm.current_password}
                    onChange={e => setSecurityForm(p => ({ ...p, current_password: e.target.value }))}
                    placeholder="Wajib diisi untuk konfirmasi"
                  />
                </Field>
                <Field label="Password Baru" icon={Lock} error={errors.password}>
                  <PasswordInput
                    value={securityForm.password}
                    onChange={e => setSecurityForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Password baru (opsional)"
                  />
                </Field>
                <Field label="Konfirmasi Password Baru" icon={Lock} error={errors.password_confirmation}>
                  <PasswordInput
                    value={securityForm.password_confirmation}
                    onChange={e => setSecurityForm(p => ({ ...p, password_confirmation: e.target.value }))}
                    placeholder="Ulangi password baru"
                  />
                </Field>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSecurityForm(p => ({ ...p, current_password: '', password: '', password_confirmation: '' }))}
                  className="btn-base btn-secondary"
                >
                  Batal
                </button>
                <button type="submit" disabled={isSavingSecurity} className="btn-base btn-primary h-10 px-6 disabled:opacity-70">
                  {isSavingSecurity ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                  <span>{isSavingSecurity ? 'Menyimpan...' : 'Perbarui Keamanan'}</span>
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
