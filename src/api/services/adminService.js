import api from '../libs/axiosInstance';

export const adminService = {
  /**
   * Mengambil data statistik untuk dashboard utama
   * @returns {Promise} Response data { stats: {...} }
   */
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard-stats');
    return response.data;
  },

  /**
   * Mengambil daftar relawan yang tersedia untuk quick dispatch
   * @returns {Promise} Response data { data: [...] }
   */
  getQuickDispatchRelawan: async (params = {}) => {
    const response = await api.get('/admin/dashboard/quick-dispatch', { params });
    return response.data;
  },

  /**
   * Menugaskan relawan ke kasus SOS atau Laporan tertentu
   * @param {number|string} kasusId - ID SOS atau Laporan
   * @param {number|string} relawanId - ID Relawan yang akan di-dispatch
   * @param {string} tipe - 'sos' | 'laporan'
   * @returns {Promise}
   */
  dispatchRelawan: async (kasusId, relawanId, tipe = 'sos') => {
    const payload = {
      relawan_id: relawanId,
      tipe: tipe,
      target_id: kasusId,
    };
    if (tipe === 'laporan') {
      payload.laporan_id = kasusId;
    } else {
      payload.sos_id = kasusId;
    }
    const response = await api.post('/admin/dashboard/dispatch', payload);
    return response.data;
  },

  /**
   * Bunyikan Sirene Posko (Alarm Massal Darurat)
   * @param {Object} data - { action: 'on'|'off'|'trigger', pesan, sos_id, radius_km }
   * @returns {Promise}
   */
  triggerSirenePosko: async (data = {}) => {
    const response = await api.post('/admin/posko/sirene', data);
    return response.data;
  },

  /**
   * Menyelesaikan kasus SOS
   * @param {number|string} sosId - ID SOS
   * @returns {Promise}
   */
  selesaiSOS: async (sosId) => {
    const response = await api.put(`/admin/dashboard/sos/${sosId}/selesai`);
    return response.data;
  },

  /**
   * Mengambil daftar relawan yang menunggu verifikasi
   * @returns {Promise} Response data { data: [...] }
   */
  getPendingRelawan: async () => {
    const response = await api.get('/admin/relawan/pending');
    return response.data;
  },

  /**
   * Menyetujui atau menolak relawan
   * @param {number|string} id - ID Relawan
   * @param {string} status - 'terverifikasi' | 'ditolak'
   * @param {string} [alasanPenolakan] - Alasan penolakan jika status ditolak
   * @returns {Promise}
   */
  verifikasiRelawan: async (id, status, alasanPenolakan = null) => {
    const payload = { status_verifikasi: status };
    if (alasanPenolakan) {
      payload.alasan_penolakan = alasanPenolakan;
    }
    const response = await api.put(`/admin/relawan/${id}/verifikasi`, payload);
    return response.data;
  },

  /**
   * Mengambil log riwayat aktivitas kasus SOS
   * @param {number|string} sosId - ID SOS
   * @returns {Promise}
   */
  getSosActivities: async (sosId) => {
    const response = await api.get(`/admin/sos/${sosId}/activities`);
    return response.data;
  },

  /**
   * Mendownload export laporan CSV (mengembalikan file blob)
   * @param {Object} [params] - Query params (status, start_date, end_date)
   * @returns {Promise<Blob>}
   */
  exportLaporanCsv: async (params = {}) => {
    const response = await api.get('/admin/laporan/export', { params, responseType: 'blob' });
    return response.data;
  },

  /**
   * Mendownload export kasus darurat SOS CSV (mengembalikan file blob)
   * @param {Object} [params] - Query params (status, start_date, end_date)
   * @returns {Promise<Blob>}
   */
  exportSosCsv: async (params = {}) => {
    const response = await api.get('/admin/sos/export', { params, responseType: 'blob' });
    return response.data;
  },

  /**
   * Mendownload export rekapitulasi semua kasus (SOS & Laporan) CSV (mengembalikan file blob)
   * @param {Object} [params] - Query params (start_date, end_date)
   * @returns {Promise<Blob>}
   */
  exportKasusCsv: async (params = {}) => {
    const response = await api.get('/admin/kasus/export', { params, responseType: 'blob' });
    return response.data;
  },

  /**
   * Mengambil data untuk Peta Kasus Aktif
   * @returns {Promise}
   */
  getPetaKasus: async () => {
    const response = await api.get('/admin/dashboard/peta-kasus');
    return response.data;
  },

  /**
   * Mengambil ringkasan sebaran urgensi kasus
   * @param {Object} params - { rentang: 'semua'|'hari_ini'|'minggu_ini'|'bulan_ini' }
   * @returns {Promise}
   */
  getSebaranUrgensi: async (params = {}) => {
    const response = await api.get('/admin/dashboard/sebaran-urgensi', { params });
    return response.data;
  },

  /**
   * Mengambil tren data grafik SOS harian mingguan
   * @param {Object} params - { tanggal, rentang }
   * @returns {Promise}
   */
  getGrafikSos: async (params = {}) => {
    const response = await api.get('/admin/dashboard/grafik-sos', { params });
    return response.data;
  },

  /**
   * Global search lintas kasus & relawan
   * @param {string} q - Query pencarian
   * @returns {Promise}
   */
  globalSearch: async (q) => {
    const response = await api.get('/admin/dashboard/search', { params: { q } });
    return response.data;
  },

  // ==========================================
  // API KHUSUS SUPERADMIN (MANAJEMEN ADMIN)
  // ==========================================

  /**
   * Mengambil daftar seluruh Admin
   * @returns {Promise} Response data { data: [...], available_permissions: [...] }
   */
  getAdmins: async () => {
    const response = await api.get('/superadmin/admins');
    return response.data;
  },

  /**
   * Membuat akun Admin baru
   * @param {Object} adminData - { name, email, password, no_telp, alamat }
   * @returns {Promise}
   */
  createAdmin: async (adminData) => {
    const response = await api.post('/superadmin/admins', adminData);
    return response.data;
  },

  /**
   * Mengambil detail lengkap Admin
   * @param {number|string} id - ID Admin
   * @returns {Promise}
   */
  getAdminDetail: async (id) => {
    const response = await api.get(`/superadmin/admins/${id}`);
    return response.data;
  },

  /**
   * Mengupdate data akun Admin
   * @param {number|string} id - ID Admin
   * @param {Object} adminData - { name, email, password, no_telp, alamat }
   * @returns {Promise}
   */
  updateAdmin: async (id, adminData) => {
    const response = await api.put(`/superadmin/admins/${id}`, adminData);
    return response.data;
  },

  /**
   * Mengaktifkan atau menonaktifkan akun Admin
   * @param {number|string} id - ID Admin
   * @param {boolean} isActive - Status keaktifan (true/false)
   * @returns {Promise}
   */
  updateAdminStatus: async (id, isActive) => {
    const response = await api.put(`/superadmin/admins/${id}/status`, {
      is_active: isActive,
    });
    return response.data;
  },

  /**
   * Mengupdate hak akses / permissions Admin
   * @param {number|string} id - ID User (Admin)
   * @param {Array} permissions - Array string hak akses e.g. ['verifikasi_relawan']
   * @returns {Promise}
   */
  updateAdminPermissions: async (id, permissions) => {
    const response = await api.put(`/superadmin/admins/${id}/permissions`, {
      permissions,
    });
    return response.data;
  },

  /**
   * Mencabut semua hak akses Admin
   * @param {number|string} id - ID User (Admin)
   * @returns {Promise}
   */
  revokeAdminPermissions: async (id) => {
    const response = await api.delete(`/superadmin/admins/${id}/permissions`);
    return response.data;
  },

  // ==========================================
  // API KHUSUS SUPERADMIN (MANAJEMEN RELAWAN)
  // ==========================================

  /**
   * Mengambil daftar seluruh Relawan (Admin & Superadmin)
   * @param {Object} [params] - Query params (status_verifikasi, per_page, dll)
   * @returns {Promise} Response data { data: [...] }
   */
  getRelawanSuperadmin: async (params = { status_verifikasi: 'terverifikasi' }) => {
    const response = await api.get('/admin/relawan', { params });
    return response.data;
  },

  /**
   * Mengambil detail lengkap relawan berdasarkan ID (Admin & Superadmin)
   * @param {number|string} id - ID Relawan
   * @returns {Promise}
   */
  getRelawanDetail: async (id) => {
    const response = await api.get(`/admin/relawan/${id}`);
    return response.data;
  },

  /**
   * Mengupdate status relawan (Admin & Superadmin)
   * @param {number|string} id - ID Relawan
   * @param {boolean} isActive - Status keaktifan baru
   * @returns {Promise}
   */
  updateStatusRelawan: async (id, isActive) => {
    const response = await api.put(`/admin/relawan/${id}/updateStatus`, { is_active: isActive });
    return response.data;
  },

  /**
   * Mendaftarkan akun relawan baru dari dashboard admin (Pre-Registration via Google SSO)
   * @param {Object} data - { name, email, no_telp, alamat, pekerjaan }
   * @returns {Promise}
   */
  registerRelawan: async (data) => {
    const response = await api.post('/admin/relawan', data);
    return response.data;
  },

  /**
   * (SOS-122) Mencatat aktivitas log aksi kritis oleh admin (misal hubungi ambulans)
   * @param {number|string} sosId - ID SOS
   * @param {Object} payload - { action, keterangan }
   */
  logAksiKritis: async (sosId, payload) => {
    // Endpoint SOS-122 belum dirilis: gunakan mock sebagai fallback
    try {
      const response = await api.post(`/admin/sos/${sosId}/log-action`, payload);
      return response.data;
    } catch {
      // Fallback mock jika endpoint belum ada di backend
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log(`[Mock API] Aksi kritis dicatat untuk SOS #${sosId}:`, payload);
          resolve({ message: 'Log aktivitas berhasil dicatat (Mock).' });
        }, 300);
      });
    }
  },
};
