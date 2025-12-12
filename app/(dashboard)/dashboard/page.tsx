import { getDashboardStats, getRecentReservations, getMonthlyRevenue, getDashboardTrends } from './actions';
import { SectionCards } from './components/section-cards';
import { ChartAreaInteractive } from './components/chart-area-interactive';
import { DataTable } from './components/data-table';
import { InstallPrompt } from './components/install-prompt';

export default async function DashboardPage() {
  const [stats, recentData, revenueData, trends] = await Promise.all([
    getDashboardStats(),
    getRecentReservations(),
    getMonthlyRevenue(),
    getDashboardTrends(),
  ]);

  if ('error' in stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{stats.error}</p>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-3 py-2 md:gap-6 md:py-4">
        {/* PWA Install Prompt */}
        <div className="px-2 sm:px-4 lg:px-6">
          <InstallPrompt />
        </div>
        
        {'error' in trends ? null : <SectionCards stats={stats} trends={trends} />}
        <div className="px-2 sm:px-4 lg:px-6">
          {revenueData && 'data' in revenueData && revenueData.data ? (
            <ChartAreaInteractive data={revenueData.data} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Aucune donnée de revenu disponible
            </div>
          )}
        </div>
        {!recentData || 'error' in recentData ? (
          <div className="px-2 sm:px-4 lg:px-6 text-center py-8 text-muted-foreground">
            <p className="text-sm">Aucune donnée de réservation disponible.</p>
          </div>
        ) : (
          <DataTable data={recentData.reservations as any} />
        )}
      </div>
    </div>
  );
}
