import { AlertTriangle, Package, Zap } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/shared/StatCard';
import { StatsSkeleton, ErrorState } from '@/components/ui/States';
import { BarChartCard, DonutChartCard } from '@/components/shared/Charts';
import { QuickActions } from '@/features/dashboard/QuickActions';
import { RecentProducts } from '@/features/dashboard/RecentActivity';
import { useDashboardStats, useSettings } from '@/hooks/queries';
import { paths } from '@/routes/paths';

export function DashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useDashboardStats();
  const { data: settings } = useSettings();

  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Dashboard" description="Resumen general del sistema" />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Resumen general del sistema" />
        <StatsSkeleton count={3} />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <StatsSkeleton count={2} />
          <StatsSkeleton count={2} />
        </div>
      </div>
    );
  }

  const { totals } = stats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Vista general del catálogo de equipamientos"
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={undefined}
      />

      <QuickActions />

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total productos" value={totals.products} icon={Package} accent="success" to={paths.products} hint={`${totals.categories} categorías`} />
        <StatCard label="Productos activos" value={totals.activeProducts} icon={Zap} accent="warning" to={`${paths.products}?active=true`} hint="publicados" />
        <StatCard label="Sin stock" value={totals.outOfStock} icon={AlertTriangle} accent="danger" to={`${paths.products}?availability=out`} hint={`${totals.lowStock} con stock bajo`} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <BarChartCard
            title="Altas por mes"
            description="Equipamientos registrados en los últimos 6 meses"
            data={stats.monthly}
            series={[{ key: 'products', color: '#0EA5E9', label: 'Productos' }]}
          />
        </div>
        <DonutChartCard
          title="Productos por categoría"
          description="Distribución del catálogo"
          data={stats.categoryDistribution}
          centerValue={String(totals.products)}
          centerLabel="productos"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DonutChartCard title="Estado de stock" data={stats.stockStatus} />
        <Card className="xl:col-span-2">
          <CardHeaderLike
            title="Resumen operativo"
            description="Indicadores clave del catálogo"
          />
          <div className="grid grid-cols-1 gap-2 p-5 text-sm sm:grid-cols-2">
            <SummaryRow label="Productos con stock" value={totals.products - totals.outOfStock} />
            <SummaryRow label="Categorías" value={totals.categories} />
            <SummaryRow label="Usuarios del sistema" value={totals.users} />
            <SummaryRow label="Stock bajo (alertas)" value={totals.lowStock} />
          </div>
        </Card>
      </div>

      {/* Recientes */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RecentProducts items={stats.recentProducts} currency={settings?.currency ?? 'USD'} />
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-semibold text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  );
}

function CardHeaderLike({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
  );
}
