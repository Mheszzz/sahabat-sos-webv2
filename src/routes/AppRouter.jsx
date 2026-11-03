import { createBrowserRouter, Navigate, useParams, useRouteError, Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import MainLayout from '../components/layouts/MainLayout';
import LoginPage from '../pages/Login/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import KasusAktifPage from '../pages/KasusAktif/KasusAktifPage';
import RiwayatKasusPage from '../pages/RiwayatKasus/RiwayatKasusPage';
import PetaPemantauanPage from '../pages/PetaPemantauan/PetaPemantauanPage';
import PengaturanPage from '../pages/Pengaturan/PengaturanPage';
import ManajemenAdminPage from '../pages/ManajemenAdmin/ManajemenAdminPage';
import ManajemenUserPage from '../pages/ManajemenUser/ManajemenUserPage';
import DetailKasusPage from '../pages/DetailKasus/DetailKasusPage';
import MasterDataPage from '../pages/MasterData/MasterDataPage';
import DownloadPage from '../pages/Download/DownloadPage';

function RouteErrorFallback() {
  const error = useRouteError();
  console.error('Route error caught:', error);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4 shadow-sm">
        <AlertTriangle size={32} />
      </div>
      <h1 className="text-xl font-bold text-slate-800 sm:text-2xl mb-2">Terjadi Kendala pada Aplikasi</h1>
      <p className="max-w-md text-sm text-slate-500 mb-6">
        {error?.message || 'Halaman mengalami kesalahan saat memuat komponen sistem. Silakan muat ulang halaman.'}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 transition-colors cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Muat Ulang Halaman</span>
        </button>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <Home size={14} />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    </div>
  );
}

function DetailRelawanRedirect() {
  const { id } = useParams();
  return <Navigate to={`/manajemen-user?id=${id}`} replace />;
}

function DetailLaporanRedirect() {
  const { id } = useParams();
  return <Navigate to={`/detail-kasus/${id}?tipe=laporan`} replace />;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteErrorFallback />,
  },
  {
    path: '/download',
    element: <DownloadPage />,
    errorElement: <RouteErrorFallback />,
  },
  {
    path: '/unduh',
    element: <Navigate to="/download" replace />,
  },
  {
    path: '/app',
    element: <Navigate to="/download" replace />,
  },
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <RouteErrorFallback />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <DashboardPage />
      },
      {
        path: 'kasus-aktif',
        element: <KasusAktifPage />
      },
      {
        path: 'riwayat',
        element: <RiwayatKasusPage />
      },
      {
        path: 'peta',
        element: <PetaPemantauanPage />
      },
      {
        path: 'pengaturan',
        element: <PengaturanPage />
      },
      {
        path: 'manajemen-admin',
        element: <ManajemenAdminPage />
      },
      {
        path: 'manajemen-user',
        element: <ManajemenUserPage />
      },
      {
        path: 'master-data',
        element: <MasterDataPage />
      },
      {
        path: 'detail-kasus/:id',
        element: <DetailKasusPage />
      },
      {
        path: 'detail-relawan/:id',
        element: <DetailRelawanRedirect />
      },
      {
        path: 'detail-laporan/:id',
        element: <DetailLaporanRedirect />
      }
    ]
  }
]);
