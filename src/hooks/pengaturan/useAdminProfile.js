import { useState, useEffect, useRef } from 'react';
import { adminProfileService } from '../../api/services/adminProfileService';

/**
 * Hook untuk mengelola profil admin:
 * - Fetch data dari GET /api/admin/profile
 * - Update data diri + foto via POST /api/admin/profile (multipart)
 * - Update keamanan (email/password) via PUT /api/admin/profile/security
 * - Hapus foto via DELETE /api/admin/profile/foto
 */
export function useAdminProfile() {
  // ─── State Data ───────────────────────────────────────────────────────────
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── State Form Profil ─────────────────────────────────────────────────────
  const [formData, setFormData] = useState({ name: '', no_telp: '', alamat: '' });
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const fotoInputRef = useRef(null);

  // ─── State Form Keamanan ───────────────────────────────────────────────────
  const [securityForm, setSecurityForm] = useState({
    current_password: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  // ─── State UI ──────────────────────────────────────────────────────────────
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [isDeletingFoto, setIsDeletingFoto] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }
  const [errors, setErrors] = useState({});

  // ─── Fetch Profil ──────────────────────────────────────────────────────────
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminProfileService.getProfile();
      const user = data.user;
      setProfile(user);
      setFormData({
        name: user.name || '',
        no_telp: user.no_telp || '',
        alamat: user.alamat || '',
      });
      setSecurityForm((prev) => ({ ...prev, email: user.email || '' }));
      setFotoPreview(user.foto_profile_url || user.foto_profile || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat profil.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ─── Helpers Toast ─────────────────────────────────────────────────────────
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Handler Foto ──────────────────────────────────────────────────────────
  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleCancelFoto = () => {
    setFotoFile(null);
    setFotoPreview(profile?.foto_profile_url || profile?.foto_profile || null);
    if (fotoInputRef.current) {
      fotoInputRef.current.value = '';
    }
  };

  const handleDeleteFoto = async () => {
    if (!profile?.foto_profile) return;
    try {
      setIsDeletingFoto(true);
      await adminProfileService.deleteFoto();
      setFotoPreview(null);
      setFotoFile(null);
      setProfile((prev) => ({ ...prev, foto_profile: null, foto_profile_url: null }));
      showToast('success', 'Foto profil berhasil dihapus.');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Gagal menghapus foto.');
    } finally {
      setIsDeletingFoto(false);
    }
  };

  // ─── Submit Update Profil ──────────────────────────────────────────────────
  const handleSubmitProfile = async (e) => {
    e?.preventDefault();
    setErrors({});
    try {
      setIsSavingProfile(true);
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('no_telp', formData.no_telp);
      fd.append('alamat', formData.alamat);
      if (fotoFile) fd.append('foto_profile', fotoFile);

      const data = await adminProfileService.updateProfile(fd);
      setProfile(data.user);
      setFotoPreview(data.user.foto_profile_url || data.user.foto_profile || null);
      setFotoFile(null);
      showToast('success', 'Profil berhasil diperbarui!');
    } catch (err) {
      const apiErrors = err.response?.data?.errors || {};
      setErrors(apiErrors);
      showToast('error', err.response?.data?.message || 'Gagal menyimpan profil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ─── Submit Update Keamanan ────────────────────────────────────────────────
  const handleSubmitSecurity = async (e) => {
    e?.preventDefault();
    setErrors({});
    try {
      setIsSavingSecurity(true);
      const payload = {
        current_password: securityForm.current_password,
      };
      if (securityForm.email && securityForm.email !== profile?.email) {
        payload.email = securityForm.email;
      }
      if (securityForm.password) {
        payload.password = securityForm.password;
        payload.password_confirmation = securityForm.password_confirmation;
      }
      const data = await adminProfileService.updateSecurity(payload);
      if (data.email) {
        setProfile((prev) => ({ ...prev, email: data.email }));
        setSecurityForm((prev) => ({ ...prev, email: data.email }));
      }
      setSecurityForm((prev) => ({
        ...prev,
        current_password: '',
        password: '',
        password_confirmation: '',
      }));
      showToast('success', data.message || 'Keamanan berhasil diperbarui!');
    } catch (err) {
      const apiErrors = err.response?.data?.errors || {};
      setErrors(apiErrors);
      showToast('error', err.response?.data?.message || 'Gagal memperbarui keamanan.');
    } finally {
      setIsSavingSecurity(false);
    }
  };

  return {
    // Data
    profile,
    isLoading,
    error,
    // Form profil
    formData,
    setFormData,
    fotoPreview,
    fotoFile,
    hasPendingFoto: Boolean(fotoFile),
    fotoInputRef,
    handleFotoChange,
    handleCancelFoto,
    handleDeleteFoto,
    isDeletingFoto,
    handleSubmitProfile,
    isSavingProfile,
    // Form keamanan
    securityForm,
    setSecurityForm,
    handleSubmitSecurity,
    isSavingSecurity,
    // UI
    toast,
    errors,
    refetchProfile: fetchProfile,
  };
}
