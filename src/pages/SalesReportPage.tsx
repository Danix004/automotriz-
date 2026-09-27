import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, DollarSign, Eye, Plus, Receipt, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Field } from '@/components/ui/Field';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState, ErrorState, LoadingState, NoResults } from '@/components/ui/States';
import { StatCard } from '@/components/shared/StatCard';
import { AreaChartCard, BarChartCard, DonutChartCard, HorizontalBars } from '@/components/shared/Charts';
import { useSale, useSales, useSalesReport, useSettings } from '@/hooks/queries';
import { useListState } from '@/hooks/useListState';
import { formatCurrency, formatDateTime, formatNumber, truncate } from '@/utils/format';
import { paths } from '@/routes/paths';
import { PAYMENT_METHODS, type PaymentMethod, type Sale, type SaleWithItems } from '@/types';

const METHOD_BADGE: Record<PaymentMethod, BadgeVariant> = {
  Efectivo: 'success',
  Tarjeta: 'primary',
  Transferencia: 'info',
  QR: 'warning',
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

function SaleDetail({ sale, currency }: { sale: SaleWithItems; currency: string }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <DetailRow label="Folio" value={sale.number} />
        </div>
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <DetailRow label="Fecha" value={formatDateTime(sale.createdAt)} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
              <th className="px-3 py-2 font-medium">Producto</th>
              <th className="px-3 py-2 text-center font-medium">Cant.</th>
              <th className="px-3 py-2 text-right font-medium">Precio</th>
              <th className="px-3 py-2 text-right font-medium">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-2">
                  <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.sku}</p>
                </td>
                <td className="px-3 py-2 text-center text-slate-700 dark:text-slate-300">{item.quantity}</td>
                <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                  {formatCurrency(item.price, currency)}
                </td>
                <td className="px-3 py-2 text-right font-medium text-slate-900 dark:text-white">
                  {formatCurrency(item.subtotal, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-1.5 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
        <DetailRow label="Subtotal" value={formatCurrency(sale.subtotal, currency)} />
        <DetailRow label="Descuento" value={`-${formatCurrency(sale.discount, currency)}`} />
        <div className="flex justify-between gap-3 border-t border-dashed border-slate-200 pt-2 text-base font-bold text-slate-900 dark:border-slate-700 dark:text-white">
          <span>Total</span>
          <span>{formatCurrency(sale.total, currency)}</span>
        </div>
        <DetailRow label="Método de pago" value={sale.paymentMethod} />
        <DetailRow label="Recibido" value={formatCurrency(sale.amountPaid, currency)} />
        <DetailRow label="Vuelto" value={formatCurrency(sale.change, currency)} />
        {sale.notes && <p className="pt-1 text-xs text-slate-500">Nota: {sale.notes}</p>}
      </div>
    </div>
  );
}

/**
 * Reporte detallado de ventas: KPIs, evolución diaria, métodos de pago,
 * productos más vendidos y detalle de cada venta. Filtros en la URL.
 */
export function SalesReportPage() {
  const navigate = useNavigate();
  const settings = useSettings();
  const currency = settings.data?.currency ?? 'USD';

  const list = useListState({ defaults: { q: '', from: '', to: '', paymentMethod: '' } });

  const report = useSalesReport({
    from: list.filters.from || undefined,
    to: list.filters.to || undefined,
  });
  const sales = useSales({ ...list.queryParams });

  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = useSale(detailId ?? undefined);

  const totals = report.data?.totals;
  const byDay = report.data?.byDay ?? [];
  const byMethod = report.data?.byMethod ?? [];
  const topProducts = report.data?.topProducts ?? [];
  const hasData = (totals?.sales ?? 0) > 0;

  const rangeLabel =
    list.filters.from && list.filters.to
      ? `${list.filters.from} → ${list.filters.to}`
      : list.filters.from
        ? `desde ${list.filters.from}`
        : list.filters.to
          ? `hasta ${list.filters.to}`
          : 'últimos 30 días';

  const columns: Array<Column<Sale>> = [
    {
      key: 'number',
      header: 'Folio',
      sortable: true,
      accessor: (sale) => <span className="font-medium text-slate-900 dark:text-white">{sale.number}</span>,
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      sortable: true,
      accessor: (sale) => formatDateTime(sale.createdAt),
      hideOn: 'sm',
    },
    {
      key: 'itemsCount',
      header: 'Artículos',
      sortable: true,
      align: 'right',
      accessor: (sale) => sale.itemsCount,
    },
    {
      key: 'paymentMethod',
      header: 'Método',
      sortable: true,
      accessor: (sale) => <Badge variant={METHOD_BADGE[sale.paymentMethod] ?? 'neutral'}>{sale.paymentMethod}</Badge>,
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      align: 'right',
      accessor: (sale) => <span className="font-semibold">{formatCurrency(sale.total, currency)}</span>,
    },
    {
      key: 'actions',
      header: <span className="sr-only">Detalle</span>,
      align: 'right',
      accessor: (sale) => (
        <button
          type="button"
          aria-label={`Ver detalle de la venta ${sale.number}`}
          onClick={() => setDetailId(sale.id)}
          className="rounded-lg p-2 text-slate-400 hover:bg-primary/10 hover:text-primary"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reporte de ventas"
        description="Detalle de lo vendido: KPIs, evolución diaria y cada venta registrada"
        breadcrumbs={[{ label: 'Ventas' }, { label: 'Reporte' }]}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => navigate(paths.cashRegister)}>
            Ir a la caja
          </Button>
        }
      />

      {/* -------------------------------- KPIs -------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total vendido"
          value={formatCurrency(totals?.revenue ?? 0, currency)}
          icon={DollarSign}
          accent="primary"
          hint={rangeLabel}
        />
        <StatCard
          label="Ventas"
          value={formatNumber(totals?.sales ?? 0)}
          icon={Receipt}
          accent="secondary"
          hint={`${formatNumber(totals?.today.sales ?? 0)} hoy`}
        />
        <StatCard
          label="Ticket promedio"
          value={formatCurrency(totals?.avgTicket ?? 0, currency)}
          icon={Wallet}
          accent="success"
          hint="por venta"
        />
        <StatCard
          label="Unidades vendidas"
          value={formatNumber(totals?.units ?? 0)}
          icon={Boxes}
          accent="warning"
          hint="artículos"
        />
      </div>

      {/* ------------------------------- filtros ------------------------------ */}
      <Card>
        <CardBody className="flex flex-wrap items-end gap-3">
          <Field label="Buscar" className="min-w-[180px] flex-1">
            <SearchInput
              value={list.search}
              onValueChange={list.setSearch}
              placeholder="Folio o notas…"
            />
          </Field>
          <Field label="Desde" className="min-w-[150px]">
            <Input
              type="date"
              value={list.filters.from}
              onChange={(event) => list.setFilter('from', event.target.value)}
            />
          </Field>
          <Field label="Hasta" className="min-w-[150px]">
            <Input
              type="date"
              value={list.filters.to}
              onChange={(event) => list.setFilter('to', event.target.value)}
            />
          </Field>
          <Field label="Método de pago" className="min-w-[170px]">
            <Select
              value={list.filters.paymentMethod}
              onChange={(event) => list.setFilter('paymentMethod', event.target.value)}
              placeholder="Todos"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </Select>
          </Field>
          {list.hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => list.clearFilters()}>
              Limpiar filtros
            </Button>
          )}
        </CardBody>
      </Card>

      {/* ------------------------------- gráficas ----------------------------- */}
      {report.isError ? (
        <ErrorState onRetry={() => void report.refetch()} />
      ) : report.isLoading ? (
        <LoadingState label="Calculando el reporte…" />
      ) : !hasData ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Receipt className="h-7 w-7" />}
              title="Sin ventas en este rango"
              description="Ajusta las fechas o registra ventas desde la caja para ver el desglose."
              action={
                <Button icon={<Plus className="h-4 w-4" />} onClick={() => navigate(paths.cashRegister)}>
                  Ir a la caja
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <AreaChartCard
            title="Ingresos por día"
            description={`Rango: ${rangeLabel}`}
            data={byDay.map((day) => ({ month: day.label, ingresos: day.revenue }))}
            dataKey="ingresos"
          />
          <BarChartCard
            title="Ventas y unidades por día"
            description="Volumen diario de operaciones"
            data={byDay.map((day) => ({ month: day.label, ventas: day.sales, unidades: day.units }))}
            series={[
              { key: 'ventas', color: '#2563EB', label: 'Ventas' },
              { key: 'unidades', color: '#22C55E', label: 'Unidades' },
            ]}
          />
          <DonutChartCard
            title="Ingresos por método de pago"
            description="Participación sobre el total cobrado"
            data={byMethod.map((method) => ({ name: method.name, value: method.revenue }))}
            centerLabel="cobrado"
            centerValue={formatCurrency(totals?.revenue ?? 0, currency)}
          />
          <HorizontalBars
            title="Productos más vendidos"
            data={topProducts.map((product) => ({
              name: truncate(product.name, 16),
              value: product.units,
            }))}
          />
        </div>
      )}

      {/* ------------------------------- listado ------------------------------ */}
      <Card>
        <CardHeader
          title="Ventas registradas"
          description={`${sales.data?.total ?? 0} ventas · ${rangeLabel}`}
        />
        <CardBody>
          {sales.isError ? (
            <ErrorState onRetry={() => void sales.refetch()} />
          ) : (
            <DataTable<Sale>
              columns={columns}
              rows={sales.data?.items ?? []}
              rowKey={(sale) => sale.id}
              loading={sales.isLoading}
              sortField={list.sortField}
              sortDirection={list.sortDirection}
              onSort={list.toggleSort}
              empty={
                list.hasFilters ? (
                  <NoResults term={list.debouncedSearch} onClear={() => list.clearFilters()} />
                ) : (
                  <EmptyState
                    title="Aún no hay ventas"
                    description="Registra la primera venta desde la caja y aparecerá aquí con su detalle."
                    action={
                      <Button icon={<Plus className="h-4 w-4" />} onClick={() => navigate(paths.cashRegister)}>
                        Ir a la caja
                      </Button>
                    }
                  />
                )
              }
              pagination={{
                page: sales.data?.page ?? 1,
                pageSize: sales.data?.pageSize ?? list.pageSize,
                total: sales.data?.total ?? 0,
                totalPages: sales.data?.totalPages ?? 1,
                onPageChange: list.setPage,
                onPageSizeChange: list.setPageSize,
              }}
            />
          )}
        </CardBody>
      </Card>

      {/* -------------------------------- detalle ----------------------------- */}
      <Modal
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        title={detail.data ? `Venta ${detail.data.number}` : 'Detalle de venta'}
        description={detail.data ? formatDateTime(detail.data.createdAt) : undefined}
        size="lg"
        footer={
          <Button variant="outline" onClick={() => setDetailId(null)}>
            Cerrar
          </Button>
        }
      >
        {detail.isLoading ? (
          <LoadingState label="Cargando venta…" />
        ) : detail.isError ? (
          <ErrorState onRetry={() => void detail.refetch()} />
        ) : detail.data ? (
          <SaleDetail sale={detail.data} currency={currency} />
        ) : null}
      </Modal>
    </div>
  );
}
