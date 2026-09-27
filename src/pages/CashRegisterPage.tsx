import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Landmark,
  Minus,
  Plus,
  QrCode,
  Receipt,
  ShoppingCart,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Field } from '@/components/ui/Field';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, LoadingState, NoResults } from '@/components/ui/States';
import { SmartImage } from '@/components/shared/SmartImage';
import { useCreateSale, useProducts, useSettings } from '@/hooks/queries';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { useDebouncedValue } from '@/utils/effects';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import { paths } from '@/routes/paths';
import { toast } from '@/store/toastStore';
import { PAYMENT_METHODS, type PaymentMethod, type Product, type SaleWithItems } from '@/types';
import { saleSchema, type SaleFormValues } from '@/schemas';

const PRODUCT_FILTERS = { q: '' };

const METHOD_ICONS: Record<PaymentMethod, LucideIcon> = {
  Efectivo: Banknote,
  Tarjeta: CreditCard,
  Transferencia: Landmark,
  QR: QrCode,
};

interface CartLine {
  productId: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Caja (punto de venta): buscador de productos, carrito con stock,
 * cobro por método de pago y vuelto. Al confirmar, la API descuenta el stock.
 */
export function CashRegisterPage() {
  const navigate = useNavigate();
  const settings = useSettings();
  const currency = settings.data?.currency ?? 'USD';

  const { filters, setFilter } = useUrlFilters(PRODUCT_FILTERS);
  const debouncedTerm = useDebouncedValue(filters.q, 350);
  const products = useProducts({
    search: debouncedTerm || undefined,
    active: 'true',
    pageSize: 0,
  });

  const createSale = useCreateSale();

  const [cart, setCart] = useState<CartLine[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ticket, setTicket] = useState<SaleWithItems | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: { paymentMethod: 'Efectivo', amountPaid: undefined, discount: 0, notes: '' },
  });

  const paymentMethod = watch('paymentMethod');
  const discountField = Number(watch('discount'));
  const paidField = Number(watch('amountPaid'));

  const subtotal = round2(cart.reduce((sum, line) => sum + line.price * line.quantity, 0));
  const units = cart.reduce((sum, line) => sum + line.quantity, 0);
  const discount = Number.isFinite(discountField) && discountField > 0 ? discountField : 0;
  const total = Math.max(0, round2(subtotal - discount));
  const cash = paymentMethod === 'Efectivo';
  const change = cash && Number.isFinite(paidField) ? Math.max(0, round2(paidField - total)) : 0;

  /* ------------------------------ carrito ------------------------------ */

  const addToCart = (product: Product) => {
    const line = cart.find((entry) => entry.productId === product.id);
    const inCart = line?.quantity ?? 0;
    if (product.stock <= 0 || inCart >= product.stock) {
      toast.warning('Stock insuficiente', `Solo hay ${product.stock} unidades de ${product.name}.`);
      return;
    }
    const price = product.promotionalPrice ?? product.price;
    if (line) {
      setCart((current) =>
        current.map((entry) =>
          entry.productId === product.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
        ),
      );
    } else {
      setCart((current) => [
        ...current,
        { productId: product.id, sku: product.sku, name: product.name, price, stock: product.stock, quantity: 1 },
      ]);
    }
  };

  const changeQuantity = (productId: string, delta: number) => {
    setCart((current) =>
      current
        .map((line) => {
          if (line.productId !== productId) return line;
          const quantity = line.quantity + delta;
          if (quantity <= 0) return { ...line, quantity: 0 };
          return { ...line, quantity: Math.min(quantity, line.stock) };
        })
        .filter((line) => line.quantity > 0),
    );
  };

  const removeLine = (productId: string) =>
    setCart((current) => current.filter((line) => line.productId !== productId));

  const clearCart = () => setCart([]);

  /* ------------------------------- cobro ------------------------------- */

  const openCheckout = () => {
    if (cart.length === 0) {
      toast.error('Carrito vacío', 'Agrega al menos un producto para poder cobrar.');
      return;
    }
    setCheckoutOpen(true);
  };

  const submit: SubmitHandler<SaleFormValues> = (values) => {
    if (cart.length === 0) {
      toast.error('Carrito vacío', 'Agrega al menos un producto para poder cobrar.');
      return;
    }

    const appliedDiscount = Number(values.discount ?? 0);
    const appliedTotal = round2(subtotal - appliedDiscount);
    if (appliedTotal < 0) {
      setError('discount', { message: 'El descuento supera el subtotal' });
      return;
    }

    const received =
      values.paymentMethod === 'Efectivo' && values.amountPaid !== undefined && !Number.isNaN(values.amountPaid)
        ? values.amountPaid
        : appliedTotal;

    if (received < appliedTotal) {
      setError('amountPaid', { message: 'El importe recibido es menor que el total a pagar' });
      return;
    }

    clearErrors();

    createSale.mutate(
      {
        items: cart.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        paymentMethod: values.paymentMethod,
        amountPaid: received,
        discount: appliedDiscount,
        notes: values.notes,
      },
      {
        onSuccess: (sale) => {
          setTicket(sale);
          setCart([]);
          setCheckoutOpen(false);
          reset();
          toast.success('Venta registrada', `${sale.number} · ${formatCurrency(sale.total, currency)}`);
        },
        onError: (error) => toast.error('No se pudo registrar la venta', getErrorMessage(error)),
      },
    );
  };

  /* ------------------------------- render ------------------------------ */

  const list = products.data?.items ?? [];
  const MethodIcon = METHOD_ICONS[paymentMethod] ?? Banknote;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Caja"
        description="Punto de venta: busca productos, cobra y el stock se descuenta automáticamente"
        breadcrumbs={[{ label: 'Ventas' }, { label: 'Caja' }]}
        actions={
          <Button
            variant="outline"
            icon={<TrendingUp className="h-4 w-4" />}
            onClick={() => navigate(paths.sales)}
          >
            Reporte de ventas
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* ---------------------------- catálogo ---------------------------- */}
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader
              title="Productos"
              description={`${products.data?.total ?? 0} productos activos`}
              actions={
                <SearchInput
                  value={filters.q}
                  onValueChange={(value) => setFilter('q', value)}
                  placeholder="Buscar por nombre o SKU…"
                  className="w-full sm:w-72"
                />
              }
            />
            <CardBody>
              {products.isError ? (
                <ErrorState onRetry={() => void products.refetch()} />
              ) : products.isLoading ? (
                <LoadingState label="Cargando productos…" />
              ) : list.length === 0 ? (
                <NoResults term={filters.q} onClear={() => setFilter('q', '')} />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                  {list.map((product) => {
                    const price = product.promotionalPrice ?? product.price;
                    const inCart = cart.find((line) => line.productId === product.id)?.quantity ?? 0;
                    const soldOut = product.stock <= 0;
                    const full = inCart >= product.stock;

                    return (
                      <div
                        key={product.id}
                        className={cn(
                          'flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3',
                          soldOut && 'opacity-60',
                        )}
                      >
                        <div className="relative h-24 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                          <SmartImage src={product.image} alt={product.name} className="h-full w-full" />
                          {product.promotionalPrice !== null && (
                            <Badge variant="danger" className="absolute left-2 top-2">
                              Oferta
                            </Badge>
                          )}
                          {inCart > 0 && (
                            <Badge variant="primary" className="absolute right-2 top-2">
                              {inCart} en carrito
                            </Badge>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                            {product.name}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{product.sku}</p>
                        </div>

                        <div className="flex items-end justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {formatCurrency(price, currency)}
                            </p>
                            <p
                              className={cn(
                                'text-[11px]',
                                soldOut
                                  ? 'text-danger'
                                  : product.stock <= 5
                                    ? 'text-warning'
                                    : 'text-slate-500 dark:text-slate-400',
                              )}
                            >
                              {soldOut ? 'Sin stock' : `${product.stock} disponibles`}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={inCart > 0 ? 'secondary' : 'primary'}
                            disabled={soldOut || full}
                            icon={inCart > 0 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                            onClick={() => addToCart(product)}
                          >
                            {inCart > 0 ? 'Agregar' : 'Añadir'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* ------------------------------ carrito ---------------------------- */}
        <div className="xl:col-span-1">
          <div className="space-y-4 xl:sticky xl:top-4">
            <Card>
              <CardHeader
                title="Venta actual"
                description={units > 0 ? `${units} artículos · ${cart.length} líneas` : 'Carrito vacío'}
                actions={
                  cart.length > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={clearCart}
                    >
                      Vaciar
                    </Button>
                  ) : undefined
                }
              />
              <CardBody className="space-y-3">
                {cart.length === 0 ? (
                  <EmptyState
                    icon={<ShoppingCart className="h-7 w-7" />}
                    title="Sin productos"
                    description="Agrega productos desde el catálogo para iniciar una venta."
                  />
                ) : (
                  <>
                    <ul className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
                      {cart.map((line) => (
                        <li
                          key={line.productId}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 p-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                                {line.name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {line.sku} · {formatCurrency(line.price, currency)}
                              </p>
                            </div>
                            <button
                              type="button"
                              aria-label={`Quitar ${line.name}`}
                              onClick={() => removeLine(line.productId)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-danger/10 hover:text-danger"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                aria-label={`Restar unidad de ${line.name}`}
                                onClick={() => changeQuantity(line.productId, -1)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center text-sm font-semibold text-slate-900 dark:text-white">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                aria-label={`Sumar unidad de ${line.name}`}
                                disabled={line.quantity >= line.stock}
                                onClick={() => changeQuantity(line.productId, 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {formatCurrency(round2(line.price * line.quantity), currency)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-3 text-sm">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal, currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Artículos</span>
                        <span>{units}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white">
                        <span>Total</span>
                        <span>{formatCurrency(subtotal, currency)}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      icon={<Receipt className="h-4 w-4" />}
                      onClick={openCheckout}
                    >
                      Cobrar
                    </Button>
                    <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                      El stock se descuenta al confirmar el pago.
                    </p>
                  </>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* ------------------------------- cobro ------------------------------ */}
      <Modal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        title="Cobrar venta"
        description={`${units} artículos · Total ${formatCurrency(total, currency)}`}
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setCheckoutOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="checkout-form"
              variant="success"
              icon={<MethodIcon className="h-4 w-4" />}
              loading={createSale.isPending}
            >
              Confirmar pago
            </Button>
          </>
        }
      >
        <form id="checkout-form" onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Descuento</span>
              <span>-{formatCurrency(discount, currency)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white">
              <span>Total a pagar</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
          </div>

          <Field label="Método de pago" htmlFor="pay-method" required>
            <Select id="pay-method" {...register('paymentMethod')}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Descuento"
            htmlFor="pay-discount"
            hint="Monto a descontar sobre el subtotal"
          >
            <Input
              id="pay-discount"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              error={errors.discount?.message}
              {...register('discount', {
                setValueAs: (value: unknown) =>
                  value === '' || value === null || value === undefined ? 0 : Number(value),
              })}
            />
          </Field>

          {cash ? (
            <Field
              label="Importe recibido"
              htmlFor="pay-amount"
              required
              hint={`Vuelto: ${formatCurrency(change, currency)}`}
            >
              <Input
                id="pay-amount"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder={total.toFixed(2)}
                icon={<Banknote className="h-4 w-4" />}
                error={errors.amountPaid?.message}
                {...register('amountPaid', {
                  setValueAs: (value: unknown) =>
                    value === '' || value === null || value === undefined ? undefined : Number(value),
                })}
              />
            </Field>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3">
              <MethodIcon className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Cobro por {paymentMethod}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Se registra el importe exacto de {formatCurrency(total, currency)}.
                </p>
              </div>
            </div>
          )}

          <Field label="Notas (opcional)" htmlFor="pay-notes">
            <Input
              id="pay-notes"
              placeholder="Ej. Cliente frecuente, factura a nombre de…"
              error={errors.notes?.message}
              {...register('notes')}
            />
          </Field>
        </form>
      </Modal>

      {/* ------------------------------- ticket ----------------------------- */}
      <Modal
        open={Boolean(ticket)}
        onClose={() => setTicket(null)}
        title={ticket ? `Ticket ${ticket.number}` : 'Ticket'}
        description={ticket ? formatDateTime(ticket.createdAt) : undefined}
        footer={
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setTicket(null);
              setCheckoutOpen(false);
            }}
          >
            Nueva venta
          </Button>
        }
      >
        {ticket && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-success/10 px-4 py-3">
              <span className="text-sm font-medium text-success-600 dark:text-success-500">
                Pago confirmado · {ticket.paymentMethod}
              </span>
              <span className="text-lg font-bold text-success-600 dark:text-success-500">
                {formatCurrency(ticket.total, currency)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                    <th className="pb-2 font-medium">Producto</th>
                    <th className="pb-2 text-center font-medium">Cant.</th>
                    <th className="pb-2 text-right font-medium">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ticket.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2">
                        <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {item.sku} · {formatCurrency(item.price, currency)}
                        </p>
                      </td>
                      <td className="py-2 text-center text-slate-700 dark:text-slate-300">{item.quantity}</td>
                      <td className="py-2 text-right font-medium text-slate-900 dark:text-white">
                        {formatCurrency(item.subtotal, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1.5 border-t border-dashed border-slate-300 pt-3 text-sm dark:border-slate-700">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Subtotal</span>
                <span>{formatCurrency(ticket.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Descuento</span>
                <span>-{formatCurrency(ticket.discount, currency)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white">
                <span>Total</span>
                <span>{formatCurrency(ticket.total, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Recibido</span>
                <span>{formatCurrency(ticket.amountPaid, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Vuelto</span>
                <span>{formatCurrency(ticket.change, currency)}</span>
              </div>
              {ticket.notes && (
                <p className="pt-1 text-xs text-slate-500 dark:text-slate-400">Nota: {ticket.notes}</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
