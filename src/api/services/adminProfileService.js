import api from '../libs/axiosInstance';
import { authService } from './authService';

export const adminProfileService = {
  /**
   * GET /api/admin/profile
   * Ambil profil admin yang sedang login
   */
  getProfile: async () => {
    const response = await api.get('/admin/profile');
    if (response.data?.user) {
      authService.updateUser(response.data.user);
    }
    return response.data;
  },

  /**
   * POST /api/admin/profile
   * Update data diri (name, no_telp, alamat) dan/atau foto profil.
   * Wajib pakai FormData karena bisa ada file upload.
   * @param {FormData} formData
   */
  updateProfile: async (formData) => {
    const response = await api.post('/admin/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Sinkronisasi data user & siarkan perubahan ke Sidebar & Layout
    if (response.data?.user) {
      authService.updateUser(response.data.user);
    }
    return response.data;
  },

  /**
   * PUT /api/admin/profile/security
   * Ganti email dan/atau password.
   * @param {{ current_password, email?, password?, password_confirmation? }} payload
   */
  updateSecurity: async (payload) => {
    const response = await api.put('/admin/profile/security', payload);
    if (response.data?.email) {
      authService.updateUser({ email: response.data.email });
    }
    return response.data;
  },

  /**
   * DELETE /api/admin/profile/foto
   * Hapus foto profil admin.
   */
  deleteFoto: async () => {
    const response = await api.delete('/admin/profile/foto');
    authService.updateUser({ foto_profile: null, foto_profile_url: null });
    return response.data;
  },
};
