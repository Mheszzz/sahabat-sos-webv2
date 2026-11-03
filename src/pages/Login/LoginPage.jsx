import { Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2, ShieldCheck, Activity, Info, X, Smartphone } from 'lucide-react';
import { useAuthForm } from '../../hooks/login/useAuthForm';
import { s } from './LoginStyles';

export default function LoginPage() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    loading,
    error,
    setError,
    shake,
    modalInfo,
    openInfoModal,
    closeModal,
    isDemoEnabled,
    demoEmail,
    demoPassword,
    handleFillDemo,
    handleSubmit,
  } = useAuthForm();

  return (
    <div style={s.root} className="login-root">
      {/* Left panel - Branding & Ikhtisar Platform */}
      <div style={s.leftPanel} className="login-left-panel">
        <div style={s.leftTop}>
          <div style={s.logoWrap}>
            <div style={s.logoBox}>
              <img
                src="/logo.png"
                alt="Sahabat SOS Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <p style={s.brandName}>Sahabat SOS</p>
              <p style={s.brandSub}>Admin Dashboard</p>
            </div>
          </div>
          <span style={s.liveBadge}>
            <span style={s.liveDot} />
            Sistem Aktif
          </span>
        </div>

        <div style={s.leftBody}>
          <div style={s.leftIcon}>
            <ShieldCheck size={42} color="rgba(52,211,153,0.85)" />
          </div>
          <h2 style={s.leftTitle}>Panel Kontrol Pusat</h2>
          <p style={s.leftDesc}>
            Platform pemantauan dan tanggap darurat inklusif untuk penyandang disabilitas
            di seluruh wilayah Indonesia.
          </p>
          <div style={s.statGrid}>
            <div style={s.statCard}>
              <span style={s.statNum}>DIY</span>
              <span style={s.statLabel}>Wilayah Layanan</span>
            </div>
            <div style={s.statCard}>
              <span style={s.statNum}>24/7</span>
              <span style={s.statLabel}>Siaga Tanggap</span>
            </div>
            <div style={s.statCard}>
              <span style={s.statNum}>Inklusi</span>
              <span style={s.statLabel}>Multi-Disabilitas</span>
            </div>
          </div>
          <div style={s.statusRow}>
            <Activity size={13} color="#34d399" />
            <span style={s.statusText}>Semua layanan berjalan normal</span>
          </div>
        </div>

        <p style={s.leftFooter}>
          &copy; {new Date().getFullYear()} Sahabat SOS - Inklusi &amp; Tanggap Darurat Difabel
        </p>
      </div>

      {/* Right panel - Form Login */}
      <div style={s.rightPanel}>
        <div
          style={s.formCard}
          className={shake ? 'login-shake' : ''}
        >
          <div style={s.formHeader}>
            <h1 style={s.formTitle}>Masuk ke Akun Anda</h1>
            <p style={s.formSub}>Khusus akses Superadmin &amp; Administrator</p>
          </div>

          <form onSubmit={handleSubmit} noValidate style={s.form}>
            <div style={s.fieldGroup}>
              <label htmlFor="login-email" style={s.label}>Alamat Email</label>
              <input
                id="login-email"
                type="email"
                style={{ ...s.input, ...(error ? s.inputErr : {}) }}
                placeholder="contoh: admin@sahabatsos.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                autoComplete="username"
                disabled={loading}
                className="login-input"
              />
            </div>

            <div style={s.fieldGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="login-password" style={s.label}>Kata Sandi</label>
                <button
                  type="button"
                  style={s.forgotBtn}
                  onClick={() => openInfoModal('forgot')}
                  className="hover-underline"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div style={s.pwWrap}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  style={{ ...s.input, paddingRight: '42px', ...(error ? s.inputErr : {}) }}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                  disabled={loading}
                  className="login-input"
                />
                <button
                  type="button"
                  style={s.eyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="login-eye-btn"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={s.errorBox} role="alert">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <button
              id="btn-login-submit"
              type="submit"
              style={s.submitBtn}
              disabled={loading}
              className="login-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spinAnim 0.8s linear infinite' }} />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Masuk</span>
              )}
            </button>
          </form>

          {isDemoEnabled && (
            <>
              <div style={s.divider}>
                <div style={s.dividerLine} />
                <span style={s.dividerText}>Akun Demo Pengujian</span>
                <div style={s.dividerLine} />
              </div>

              <div
                style={s.demoBox}
                className="login-demo-box"
                onClick={handleFillDemo}
                title="Klik untuk mengisi form otomatis"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleFillDemo();
                  }
                }}
              >
                <div style={s.demoHeader}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Info size={12} color="#059669" />
                    Superadmin Default
                  </span>
                  <span style={s.demoBadge}>Klik untuk Gunakan</span>
                </div>
                <div style={s.demoRow}>
                  <span style={s.demoKey}>Email</span>
                  <code style={s.demoVal}>{demoEmail}</code>
                </div>
                <div style={s.demoRow}>
                  <span style={s.demoKey}>Sandi</span>
                  <code style={s.demoVal}>{demoPassword}</code>
                </div>
              </div>
            </>
          )}
        </div>

        <p style={s.rightFooter}>
          Mengalami masalah akses?{' '}
          <button
            type="button"
            style={s.contactLink}
            onClick={() => openInfoModal('contact')}
          >
            Hubungi Administrator
          </button>
        </p>

        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Link
            to="/download"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 16px',
              backgroundColor: '#eaf8f5',
              border: '1px solid #c2ece2',
              borderRadius: '12px',
              color: '#0b6f61',
              fontSize: '12px',
              fontWeight: '600',
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(11,111,97,0.06)',
            }}
          >
            <Smartphone size={14} color="#0b6f61" />
            <span>Unduh Aplikasi Mobile (APK Android)</span>
          </Link>
        </div>
      </div>

      {/* Modal Bantuan / Info */}
      {modalInfo.isOpen && (
        <div style={s.modalOverlay} onClick={closeModal} role="dialog" aria-modal="true">
          <div style={s.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={s.modalTitle}>{modalInfo.title}</h3>
              <button
                type="button"
                onClick={closeModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>
            <p style={s.modalContent}>{modalInfo.message}</p>
            <button
              type="button"
              style={s.modalCloseBtn}
              onClick={closeModal}
              className="login-submit-btn"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spinAnim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-7px); }
          40% { transform: translateX(7px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .login-shake { animation: shake 0.45s ease; }
        .login-input {
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .login-input:focus {
          outline: none;
          border-color: #059669 !important;
          box-shadow: 0 0 0 3px rgba(5,150,105,0.12) !important;
        }
        .login-input:disabled { opacity: 0.55; cursor: not-allowed; }
        .login-eye-btn:hover { color: #111827 !important; }
        .login-submit-btn {
          transition: background-color 0.15s, transform 0.1s;
        }
        .login-submit-btn:hover:not(:disabled) {
          background-color: #064e3b !important;
          transform: translateY(-1px);
        }
        .login-submit-btn:active:not(:disabled) { transform: translateY(0); }
        .login-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .login-demo-box:hover {
          background-color: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          transform: translateY(-1px);
        }
        .hover-underline:hover { text-decoration: underline; }
        @media (max-width: 860px) {
          .login-left-panel {
            display: none !important;
          }
          .login-root {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
