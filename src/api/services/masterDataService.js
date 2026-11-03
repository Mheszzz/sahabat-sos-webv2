import api from '../libs/axiosInstance';

export const masterDataService = {
  // KATEGORI LAPORAN
  getKategori: async () => {
    const response = await api.get('/admin/kategori-laporan');
    return response.data;
  },
  
  createKategori: async (data) => {
    const response = await api.post('/admin/kategori-laporan', data);
    return response.data;
  },
  
  updateKategori: async (id, data) => {
    const response = await api.put(`/admin/kategori-laporan/${id}`, data);
    return response.data;
  },
  
  deleteKategori: async (id) => {
    const response = await api.delete(`/admin/kategori-laporan/${id}`);
    return response.data;
  },

  // PESAN CEPAT
  getPesanCepat: async () => {
    const response = await api.get('/admin/pesan-cepat');
    return response.data;
  },
  
  createPesanCepat: async (data) => {
    const response = await api.post('/admin/pesan-cepat', data);
    return response.data;
  },
  
  updatePesanCepat: async (id, data) => {
    const response = await api.put(`/admin/pesan-cepat/${id}`, data);
    return response.data;
  },
  
  deletePesanCepat: async (id) => {
    const response = await api.delete(`/admin/pesan-cepat/${id}`);
    return response.data;
  }
};
