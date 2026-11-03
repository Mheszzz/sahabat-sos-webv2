import { useDashboard } from '../../hooks/dashboard/useDashboard';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import DashboardWeeklyChart from '../../components/dashboard/DashboardWeeklyChart';
import DashboardKpiCard from '../../components/dashboard/DashboardKpiCard';
import DashboardCategoryCard from '../../components/dashboard/DashboardCategoryCard';
import DashboardSosTable from '../../components/dashboard/DashboardSosTable';
import AdminCommandMap from '../../components/AdminCommandMap';

export default function DashboardPage() {
  const {
    loading,
    lastUpdated,
    stats,
    urgensiSummary,
    mapMarkers,
    relawanCount,
    sosCount,
    laporanCount,
    categoryTimeFilter,
    isCategoryDropdownOpen,
    setIsCategoryDropdownOpen,
    categoryDropdownRef,
    categoryStats,
    maxCategoryCount,
    totalLaporanKategori,
    topCategory,
    handleCategoryFilterChange,
    weeklyChartData,
    maxWeeklyCount,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    filteredCases,
    paginatedCases,
    totalPages,
    fetchDashboardData,
    handleContact,
    handleOpenDetail,
  } = useDashboard();

  return (
    <div className="w-full space-y-3">
      {/* Header Dashboard */}
      <DashboardHeader
        loading={loading}
        lastUpdated={lastUpdated}
        onRefresh={() => fetchDashboardData()}
      />

      {/* Grid Utama: Kolom Kiri (3 Kartu Analitik) & Kolom Kanan (Peta Komando) */}
      <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-12">
        {/* Kolom Kiri: 3 Kartu Metrik Operasional */}
        <div className="flex flex-col gap-2.5 lg:col-span-5">
          {/* Card 1: Tren Panggilan SOS Mingguan */}
          <DashboardWeeklyChart
            data={weeklyChartData}
            loading={loading}
            maxWeeklyCount={maxWeeklyCount}
          />

          {/* Card 2: Statistik Kasus (Hari Ini, Minggu Lalu, Bulan Lalu) */}
          <DashboardKpiCard
            stats={stats}
            urgensiSummary={urgensiSummary}
            loading={loading}
          />

          {/* Card 3: Sebaran Kategori Laporan */}
          <DashboardCategoryCard
            categoryStats={categoryStats}
            maxCategoryCount={maxCategoryCount}
            totalLaporan={totalLaporanKategori}
            topCategory={topCategory}
            activeFilter={categoryTimeFilter}
            isDropdownOpen={isCategoryDropdownOpen}
            setIsDropdownOpen={setIsCategoryDropdownOpen}
            dropdownRef={categoryDropdownRef}
            onFilterChange={handleCategoryFilterChange}
            loading={loading}
          />
        </div>

        {/* Kolom Kanan: Peta Pemantauan Wilayah Command Center */}
        <div className="flex flex-col lg:col-span-7">
          <AdminCommandMap
            className="h-full"
            mapData={mapMarkers}
            relawanCount={relawanCount}
            sosCount={sosCount}
            laporanCount={laporanCount}
            onOpenDetail={handleOpenDetail}
            onDispatchSuccess={() => fetchDashboardData()}
          />
        </div>
      </div>

      {/* Tabel Data Kasus Darurat SOS Aktif */}
      <DashboardSosTable
        cases={filteredCases}
        paginatedCases={paginatedCases}
        totalCasesCount={filteredCases.length}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setCurrentPage={setCurrentPage}
        loading={loading}
        onOpenDetail={handleOpenDetail}
        onContact={handleContact}
      />
    </div>
  );
}
