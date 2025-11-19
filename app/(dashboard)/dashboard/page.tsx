import { getDashboardStats, getRecentReservations, getMonthlyRevenue } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import { OverviewChart } from './components/overview-chart';
import { RecentReservations } from './components/recent-reservations';
import {
  DollarSign,
  Users,
  CreditCard,
  Activity,
  Download,
} from 'lucide-react';

export default async function DashboardPage() {
  const [stats, recentData, revenueData] = await Promise.all([
    getDashboardStats(),
    getRecentReservations(),
    getMonthlyRevenue(),
  ]);

  if ('error' in stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{stats.error}</p>
      </div>
    );
  }

  // Calculate trends
  const revenueTrend = 20.1;
  const reservationsTrend = 180.1;
  const customersTrend = 19.0;
  const activeNowChange = 201;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <CalendarDateRangePicker />
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics" disabled>
            Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" disabled>
            Reports
          </TabsTrigger>
          <TabsTrigger value="notifications" disabled>
            Notifications
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(stats.revenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{revenueTrend}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Subscriptions
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  +{stats.upcomingReservations}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{reservationsTrend}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{stats.totalVehicles * 500}</div>
                <p className="text-xs text-muted-foreground">
                  +{customersTrend}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{stats.activeReservations}</div>
                <p className="text-xs text-muted-foreground">
                  +{activeNowChange} since last hour
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                {revenueData && 'data' in revenueData ? (
                  <OverviewChart data={revenueData.data} />
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>
                  You made {!recentData || 'error' in recentData ? 0 : recentData.reservations.length} sales this month.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!recentData || 'error' in recentData ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No sales yet.</p>
                  </div>
                ) : (
                  <RecentReservations reservations={recentData.reservations} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
