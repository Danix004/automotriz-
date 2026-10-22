import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import type { ProductWithCategory, VehicleWithRefs } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge, StockBadge } from '@/components/ui/Badge';
import { EmptyState, Skeleton } from '@/components/ui/States';
import { formatCurrency, relativeTime } from '@/utils/format';
import { paths } from '@/routes/paths';

/** Lista de vehículos recién agregados. */
export function RecentVehicles({ items, loading }: { items?: VehicleWithRefs[]; loading?: boolean }) {
  return (
    <Card>
      <CardHeader
        title="Vehículos recientes"
        description="Últimos vehículos incorporados al catálogo"
        actions={
          <Link to={paths.vehicles} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <CardBody className="space-y-3 p-4">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-10 w-14 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && (!items || items.length === 0) && (
          <EmptyState title="Sin vehículos" description="Agrega el primer vehículo al catálogo." />
        )}
        {!loading &&
          items?.map((vehicle) => {
            const title = `${vehicle.brand?.name ?? ''} ${vehicle.model?.name ?? ''}`.trim();
            return (
              <Link
                key={vehicle.id}
                to={paths.vehicle(vehicle.id)}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {title} <span className="text-slate-500">{vehicle.year}</span>
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {vehicle.version} · {vehicle.engine}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="h-3 w-3" />
                  {relativeTime(vehicle.createdAt)}
                </span>
              </Link>
            );
          })}
      </CardBody>
    </Card>
  );
}

/** Lista de equipamientos recientes. */
export function RecentProducts({ items, loading, currency = 'USD' }: { items?: ProductWithCategory[]; loading?: boolean; currency?: string }) {
  return (
    <Card>
      <CardHeader
        title="Equipamientos recientes"
        description="Últimos productos agregados al catálogo"
        actions={
          <Link to={paths.products} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <CardBody className="space-y-3 p-4">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && (!items || items.length === 0) && (
          <EmptyState title="Sin productos" description="Agrega el primer equipamiento al catálogo." />
        )}
        {!loading &&
          items?.map((product) => (
            <Link
              key={product.id}
              to={paths.product(product.id)}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{product.name}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{product.category.name}</Badge>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {formatCurrency(product.promotionalPrice ?? product.price, currency)}
                  </span>
                </div>
              </div>
              <StockBadge stock={product.stock} />
            </Link>
          ))}
      </CardBody>
    </Card>
  );
}
