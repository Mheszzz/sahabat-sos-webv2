import api from '../libs/axiosInstance';

export const laporanService = {
  /**
   * Mengambil daftar laporan (bisa difilter berdasarkan status)
   * @param {string} status - Opsional: 'belum ditangani', 'ditangani', 'selesai'
   * @param {number} page - Halaman untuk pagination
   * @returns {Promise} Response data { data: { current_page, data: [...], ... } }
   */
  getLaporan: async (status = null, page = 1) => {
    const params = { page };
    if (status) {
      params.status = status;
    }
    const response = await api.get('/laporan', { params });
    return response.data;
  },

  /**
   * Mengambil detail satu laporan
   * @param {number|string} id - ID Laporan
   * @returns {Promise} Response data { data: {...} }
   */
  getDetailLaporan: async (id) => {
    const response = await api.get(`/laporan/${id}`);
    return response.data;
  },

  /**
   * Memperbarui status laporan
   * @param {number|string} id - ID Laporan
   * @param {string} status - 'belum ditangani' | 'ditangani' | 'selesai'
   * @returns {Promise}
   */
  updateStatus: async (id, status) => {
    const response = await api.put(`/laporan/${id}/status`, { status });
    return response.data;
  }
};
