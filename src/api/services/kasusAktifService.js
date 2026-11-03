import api from '../libs/axiosInstance';

export const kasusAktifService = {
  /**
   * Mengambil semua tugas aktif (SOS + Laporan) untuk Admin.
   * Response: { data: { laporan: PaginatedLaporan, sos: PaginatedSOS } }
   * @param {Object} params - { tipe: 'laporan'|'sos', status, per_page }
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get('/tugas-aktif', { params });
    return response.data;
  },

  /**
   * Mengambil hanya laporan aktif
   * @param {Object} params - { page, per_page }
   * @returns {Promise}
   */
  getLaporan: async (params = {}) => {
    const response = await api.get('/tugas-aktif/laporan', { params });
    return response.data;
  },

  /**
   * Mengambil hanya SOS aktif
   * @param {Object} params - { page, per_page }
   * @returns {Promise}
   */
  getSOS: async (params = {}) => {
    const response = await api.get('/tugas-aktif/sos', { params });
    return response.data;
  },

  /**
   * Mengambil detail satu kasus aktif
   * Response field utama: { id, status, status_raw, kategori ('SOS'|'Laporan'),
   *   jenis_laporan, pelapor, relawan, lokasi, deskripsi, waktu,
   *   battery_level, signal_strength, device_info (SOS saja),
   *   foto_laporan_url, rekam_suara_url (Laporan saja) }
   * @param {string} tipe - 'sos' | 'laporan'
   * @param {number|string} id - ID kasus
   * @returns {Promise}
   */
  getDetail: async (tipe, id) => {
    const response = await api.get(`/tugas-aktif/${tipe}/${id}`);
    return response.data;
  },

  /**
   * Dispatch relawan ke kasus aktif
   * @param {string} tipe - 'sos' | 'laporan'
   * @param {number|string} id - ID kasus
   * @param {number|string} relawanId - ID relawan
   * @returns {Promise}
   */
  dispatchRelawan: async (tipe, id, relawanId) => {
    const response = await api.post(`/tugas-aktif/${tipe}/${id}/dispatch`, {
      relawan_id: relawanId,
    });
    return response.data;
  },

  /**
   * Tandai kasus aktif sebagai selesai.
   * PENTING: field 'catatan' WAJIB diisi oleh backend.
   * @param {string} tipe - 'sos' | 'laporan'
   * @param {number|string} id - ID kasus
   * @param {string} catatan - Catatan penanganan (required)
   * @returns {Promise}
   */
  selesaikanKasus: async (tipe, id, catatan) => {
    const response = await api.patch(`/tugas-aktif/${tipe}/${id}/status`, {
      status: 'selesai',
      catatan: catatan || 'Kasus ditandai selesai oleh admin.',
    });
    return response.data;
  },

  /**
   * Mengambil alih penanganan kasus aktif oleh Admin
   * @param {string} tipe - 'sos' | 'laporan'
   * @param {number|string} id - ID kasus
   * @param {string} [catatan] - Catatan penanganan
   * @returns {Promise}
   */
  tanganiKasus: async (tipe, id, catatan = null) => {
    const response = await api.patch(`/tugas-aktif/${tipe}/${id}/status`, {
      status: 'ditangani',
      catatan: catatan || 'Kasus diambil alih dan ditangani oleh Admin.',
    });
    return response.data;
  },

  /**
   * Mengambil riwayat kasus selesai (audit admin).
   * Response: { data: { laporan: PaginatedLaporan, sos: PaginatedSOS } }
   * @param {Object} params - { tipe, per_page, page }
   * @returns {Promise}
   */
  getRiwayatAdmin: async (params = {}) => {
    const response = await api.get('/admin/riwayat-kasus', { params });
    return response.data;
  },
};
