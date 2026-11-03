import api from '../libs/axiosInstance';

export const authService = {
  /**
   * Login untuk Admin & Superadmin
   * @param {Object} credentials - { email, password }
   * @returns {Promise} Response dari API
   */
  login: async (credentials) => {
    const response = await api.post('/auth/admin/login', credentials);
    if (response.data && response.data.access_token) {
      localStorage.setItem('admin_access_token', response.data.access_token);
      authService.setUser(response.data.user);
    }
    return response.data;
  },

  /**
   * Logout Admin: memanggil endpoint backend & bersihkan localStorage
   */
  logout: async () => {
    try {
      await api.post('/logout');
    } catch {
      // Abaikan error jika token sudah expired
    } finally {
      localStorage.removeItem('admin_access_token');
      authService.setUser(null);
    }
  },

  /**
   * Cek apakah user sedang login
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('admin_access_token');
  },

  /**
   * Ambil data user yang sedang login
   */
  getUser: () => {
    try {
      const user = localStorage.getItem('admin_user_data');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  /**
   * Simpan atau update data user ke localStorage & siarkan perubahan ke seluruh komponen
   */
  setUser: (userData) => {
    try {
      if (userData) {
        localStorage.setItem('admin_user_data', JSON.stringify(userData));
      } else {
        localStorage.removeItem('admin_user_data');
      }
      window.dispatchEvent(new CustomEvent('admin-user-updated', { detail: userData }));
    } catch (e) {
      console.error('Failed to set user in localStorage', e);
    }
  },

  /**
   * Perbarui sebagian properti data user yang aktif tanpa menimpa data lainnya
   */
  updateUser: (partialData) => {
    try {
      const current = authService.getUser() || {};
      const updated = { ...current, ...partialData };
      authService.setUser(updated);
      return updated;
    } catch (e) {
      console.error('Failed to update user in localStorage', e);
      return null;
    }
  }
};
