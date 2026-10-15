import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Banknote,
  Barcode,
  CreditCard,
  Landmark,
  Minus,
  Plus,
  QrCode,
  Receipt,
  ScanLine,
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
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, LoadingState, NoResults } from '@/components/ui/States';
import { SmartImage } from '@/components/shared/SmartImage';
import { useCreateSale, useProducts, useProductByCode, useSettings } from '@/hooks/queries';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { useDebouncedValue, useMediaQuery } from '@/utils/effects';
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

const kbdClass =
  'inline-flex min-w-5 items-center justify-center rounded border border-slate-300 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-300';

function Kbd({ children }: { children: string }) {
  return <kbd className={kbdClass}>{children}</kbd>;
}

/* ------------------------------- carrito ------------------------------- */

interface CartPanelProps {
  cart: CartLine[];
  currency: string;
  subtotal: number;
  units: number;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
  showCheckout?: boolean;
  onCheckout?: () => void;
  compact?: boolean;
}

/** Líneas del carrito + resumen. Se usa en el panel lateral (escritorio) y en el modal (móvil). */
function CartPanel({
  cart,
  currency,
  subtotal,
  units,
  onIncrease,
  onDecrease,
  onRemove,
  showCheckout = false,
  onCheckout,
  compact = false,
}: CartPanelProps) {
  if (cart.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="h-7 w-7" />}
        title="Sin productos"
        description="Agrega productos desde el catálogo para iniciar una venta."
      />
    );
  }

  return (
    <>
      <ul className={cn('space-y-2 overflow-y-auto pr-1', compact ? 'max-h-[48vh]' : 'max-h-[380px]')}>
        {cart.map((line) => (
          <li
            key={line.productId}
            className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-800"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{line.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {line.sku} · {formatCurrency(line.price, currency)}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Quitar ${line.name} de la venta`}
                onClick={() => onRemove(line.productId)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/60"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`Restar unidad de ${line.name}`}
                  onClick={() => onDecrease(line.productId)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Minus className="h-4 w-4" aria-hidden />
                </button>
                <span
                  className="w-9 text-center text-sm font-bold text-slate-900 dark:text-white"
                  aria-label={`Cantidad de ${line.name}: ${line.quantity}`}
                >
                  {line.quantity}
                </span>
                <button
                  type="button"
                  aria-label={`Sumar unidad de ${line.name}`}
                  disabled={line.quantity >= line.stock}
                  onClick={() => onIncrease(line.productId)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatCurrency(round2(line.price * line.quantity), currency)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-1.5 border-t border-slate-200 pt-3 text-sm dark:border-slate-800">
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal, currency)}</span>
        </div>
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>Artículos</span>
          <span>{units}</span>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(subtotal, currency)}
          </span>
        </div>
      </div>

      {showCheckout && (
        <>
          <Button
            className="w-full"
            size="lg"
            icon={<Receipt className="h-4 w-4" aria-hidden />}
            onClick={onCheckout}
          >
            Cobrar
          </Button>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            El stock se descuenta al confirmar el pago.
          </p>
        </>
      )}
    </>
  );
}

/* --------------------------------- página -------------------------------- */

/**
 * Caja (punto de venta): buscador de productos, carrito con stock,
 * cobro por método de pago y vuelto. Al confirmar, la API descuenta el stock.
 *
 * Accesibilidad y rapidez de uso:
 * - Lector de códigos: campo propio con foco automático y captura global
 *   (teclas rápidas + Enter) para escanear desde cualquier lugar de la página.
 * - Atajos: `/` enfoca el buscador, `Enter` añade el primer resultado, `F9` cobra.
 * - Métodos de pago como grupo de radios (se navega con flechas).
 * - Botones de importe rápido y cálculo visible del vuelto.
 * - En móvil el carrito vive en una barra inferior ficha + modal.
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
  const list = products.data?.items ?? [];

  const createSale = useCreateSale();
  const scanLookup = useProductByCode();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const [cart, setCart] = useState<CartLine[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [ticket, setTicket] = useState<SaleWithItems | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [scanValue, setScanValue] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);
  const scanRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
  const hasPaid = Number.isFinite(paidField) && paidField > 0;
  const change = cash && Number.isFinite(paidField) ? Math.max(0, round2(paidField - total)) : 0;
  const missing = cash && hasPaid ? Math.max(0, round2(total - paidField)) : 0;
  const insufficient = missing > 0;

  /* ------------------------------ carrito ------------------------------ */

  /** Lee el carrito resultante y avisa a lectores de pantalla. */
  const announceCart = (lines: CartLine[], prefix?: string) => {
    const nextUnits = lines.reduce((sum, line) => sum + line.quantity, 0);
    const nextTotal = round2(lines.reduce((sum, line) => sum + line.price * line.quantity, 0));
    setAnnouncement(
      nextUnits === 0
        ? 'Carrito vacío.'
        : `${prefix ? `${prefix}. ` : ''}${nextUnits} ${nextUnits === 1 ? 'artículo' : 'artículos'} en el carrito, total ${formatCurrency(nextTotal, currency)}.`,
    );
  };

  const addToCart = (product: Product) => {
    const line = cart.find((entry) => entry.productId === product.id);
    const inCart = line?.quantity ?? 0;
    if (product.stock <= 0 || inCart >= product.stock) {
      toast.warning('Stock insuficiente', `Solo hay ${product.stock} unidades de ${product.name}.`);
      return;
    }
    const price = product.promotionalPrice ?? product.price;
    const nextLines = line
      ? cart.map((entry) =>
          entry.productId === product.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
        )
      : [
          ...cart,
          {
            productId: product.id,
            sku: product.sku,
            name: product.name,
            price,
            stock: product.stock,
            quantity: 1,
          },
        ];
    setCart(nextLines);
    announceCart(nextLines, `${product.name} agregado`);
  };

  const changeQuantity = (productId: string, delta: number) => {
    const nextLines = cart
      .map((line) => {
        if (line.productId !== productId) return line;
        const quantity = line.quantity + delta;
        if (quantity <= 0) return { ...line, quantity: 0 };
        return { ...line, quantity: Math.min(quantity, line.stock) };
      })
      .filter((line) => line.quantity > 0);
    setCart(nextLines);
    announceCart(nextLines);
  };

  const removeLine = (productId: string) => {
    const nextLines = cart.filter((line) => line.productId !== productId);
    setCart(nextLines);
    announceCart(nextLines, 'Producto quitado');
  };

  /* ------------------------- lector de códigos ------------------------- */

  /** Agrega al carrito el producto que coincida con el código escaneado. */
  const handleScan = (raw: string) => {
    const code = raw.trim();
    setScanValue('');
    if (!code) return;
    scanLookup.mutate(code, {
      onSuccess: (product) => {
        if (!product) {
          toast.error('Sin coincidencias', `No encontramos ningún producto con “${code}”.`);
          setAnnouncement(`No se encontró ningún producto con el código ${code}.`);
        } else {
          addToCart(product);
        }
        scanRef.current?.focus();
      },
      onError: () => {
        toast.error('No se pudo buscar el código', code);
        scanRef.current?.focus();
      },
    });
  };

  /** `Enter` dentro del campo del lector dispara la búsqueda. */
  const onScanKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    handleScan(event.currentTarget.value);
  };

  /** Versión estable para el listener global de teclado. */
  const handleScanRef = useRef(handleScan);
  handleScanRef.current = handleScan;

  /** El lector de códigos escribe solo: mantiene el foco listo en escritorio. */
  useEffect(() => {
    if (isDesktop) scanRef.current?.focus();
  }, [isDesktop]);

  /* ------------------------------- cobro ------------------------------- */

  const openCheckout = useCallback(() => {
    if (cart.length === 0) {
      toast.error('Carrito vacío', 'Agrega al menos un producto para poder cobrar.');
      return;
    }
    setCheckoutOpen(true);
  }, [cart.length]);

  /* Atajos de teclado + captura del lector de códigos (escritura muy rápida + Enter). */
  useEffect(() => {
    let buffer = '';
    let lastKeyAt = 0;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F9') {
        if (confirmClearOpen || ticket) return;
        event.preventDefault();
        openCheckout();
        return;
      }
      if (checkoutOpen || cartOpen || confirmClearOpen || Boolean(ticket)) {
        buffer = '';
        return;
      }

      const target = event.target;
      const inScanInput = target === scanRef.current;
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (typing && !inScanInput) {
        buffer = '';
        return;
      }

      /* El lector actúa como teclado: si el foco está fuera de un campo,
         acumulamos las teclas y, si llegan más rápido que un tecleo humano
         y terminan en Enter, buscamos el producto por código. */
      if (!inScanInput && !event.ctrlKey && !event.metaKey && !event.altKey && !event.repeat) {
        if (event.key === 'Enter') {
          if (buffer.length >= 6) {
            const code = buffer;
            buffer = '';
            event.preventDefault();
            handleScanRef.current(code);
            return;
          }
          buffer = '';
        } else if (event.key.length === 1) {
          const now = Date.now();
          if (now - lastKeyAt > 80) buffer = '';
          buffer += event.key;
          lastKeyAt = now;
        } else if (event.key !== 'Shift' && event.key !== 'CapsLock') {
          buffer = '';
        }
      }

      if (event.key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (event.key === 'Escape' && filters.q) {
        setFilter('q', '');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openCheckout, checkoutOpen, cartOpen, confirmClearOpen, ticket, filters.q, setFilter]);

  /**
   * `Enter` dentro del buscador añade el primer resultado (flujo rápido de caja).
   * Si el término todavía no se aplicó (recién tecleado o escaneado), hacemos
   * una búsqueda exacta por código para no añadir un producto desactualizado.
   */
  const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const term = filters.q.trim();
    if (!term) return;
    if (term !== debouncedTerm) {
      handleScan(term);
      return;
    }
    const first = list[0];
    if (!first) return;
    if (products.isLoading) return;
    addToCart(first);
  };

  /** Importes sugeridos: el exacto y el siguiente redondo según el billete. */
  const quickAmounts = useMemo(() => {
    if (!cash || total <= 0) return [];
    const values = new Set<number>();
    values.add(round2(total));
    [5, 10, 20, 50, 100].forEach((step) => {
      const next = Math.ceil(total / step) * step;
      if (next > total) values.add(next);
    });
    return [...values].sort((a, b) => a - b).slice(0, 5);
  }, [cash, total]);

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
          setCartOpen(false);
          reset();
          setAnnouncement(`Venta ${sale.number} registrada por ${formatCurrency(sale.total, currency)}.`);
          toast.success('Venta registrada', `${sale.number} · ${formatCurrency(sale.total, currency)}`);
        },
        onError: (error) => toast.error('No se pudo registrar la venta', getErrorMessage(error)),
      },
    );
  };

  /* ------------------------------- render ------------------------------ */

  const amountRegister = register('amountPaid', {
    setValueAs: (value: unknown) =>
      value === '' || value === null || value === undefined ? undefined : Number(value),
  });

  const MethodIcon = METHOD_ICONS[paymentMethod] ?? Banknote;

  return (
    <div className={cn('space-y-5', units > 0 && 'pb-28 xl:pb-0')}>
      <PageHeader
        title="Caja"
        description="Punto de venta: busca productos, cobra y el stock se descuenta automáticamente"
        breadcrumbs={[{ label: 'Ventas' }, { label: 'Caja' }]}
        actions={
          <Button
            variant="outline"
            icon={<TrendingUp className="h-4 w-4" aria-hidden />}
            onClick={() => navigate(paths.sales)}
          >
            Reporte de ventas
          </Button>
        }
      />

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* ---------------------------- catálogo ---------------------------- */}
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader
              title="Productos"
              description={`${products.data?.total ?? 0} productos activos`}
              actions={
                <SearchInput
                  ref={searchRef}
                  value={filters.q}
                  onValueChange={(value) => setFilter('q', value)}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Buscar por nombre, SKU o código…"
                  aria-label="Buscar productos por nombre, SKU o código de barras"
                  className="w-full sm:w-72"
                />
              }
            />
            {/* ------------------------- lector de códigos ------------------------- */}
            <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
              <label htmlFor="scan-input" className="sr-only">
                Escanear código de barras o SKU
              </label>
              <Input
                ref={scanRef}
                id="scan-input"
                icon={<Barcode className="h-4 w-4" />}
                placeholder="Escanea el código de barras o el SKU…"
                aria-describedby="scan-hint"
                autoComplete="off"
                enterKeyHint="go"
                value={scanValue}
                onChange={(event) => setScanValue(event.target.value)}
                onKeyDown={onScanKeyDown}
              />
              <p
                id="scan-hint"
                className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
              >
                <ScanLine className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Escanea un producto y se suma a la venta automáticamente; también puedes escribir
                el código y pulsar Enter.
              </p>
            </div>
            <div className="hidden flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-200 px-5 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 lg:flex">
              <span className="flex items-center gap-1.5">
                <Kbd>/</Kbd> Buscar
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>Enter</Kbd> Añadir el primer resultado
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>F9</Kbd> Cobrar
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>Esc</Kbd> Limpiar búsqueda
              </span>
            </div>
            <CardBody>
              {products.isError ? (
                <ErrorState onRetry={() => void products.refetch()} />
              ) : products.isLoading ? (
                <LoadingState label="Cargando productos…" />
              ) : list.length === 0 ? (
                <NoResults term={filters.q} onClear={() => setFilter('q', '')} />
              ) : (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-4">
                  {list.map((product) => {
                    const price = product.promotionalPrice ?? product.price;
                    const inCart = cart.find((line) => line.productId === product.id)?.quantity ?? 0;
                    const soldOut = product.stock <= 0;
                    const full = inCart >= product.stock;

                    return (
                      <div
                        key={product.id}
                        className={cn(
                          'flex flex-col gap-3 rounded-xl border border-slate-200 p-3 transition-colors dark:border-slate-800',
                          soldOut ? 'opacity-60' : 'hover:border-primary/40',
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
                          <p
                            className="truncate text-sm font-medium text-slate-900 dark:text-white"
                            title={product.name}
                          >
                            {product.name}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{product.sku}</p>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="flex items-baseline gap-1.5">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {formatCurrency(price, currency)}
                              </span>
                              {product.promotionalPrice !== null && (
                                <span className="text-xs text-slate-400 line-through dark:text-slate-500">
                                  {formatCurrency(product.price, currency)}
                                </span>
                              )}
                            </p>
                            <p
                              className={cn(
                                'text-xs',
                                soldOut
                                  ? 'font-medium text-danger'
                                  : product.stock <= 5
                                    ? 'font-medium text-warning'
                                    : 'text-slate-500 dark:text-slate-400',
                              )}
                            >
                              {soldOut ? 'Sin stock' : `${product.stock} disponibles`}
                            </p>
                          </div>

                          {inCart > 0 ? (
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  aria-label={`Restar unidad de ${product.name}`}
                                  onClick={() => changeQuantity(product.id, -1)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                  <Minus className="h-3.5 w-3.5" aria-hidden />
                                </button>
                                <span className="w-7 text-center text-sm font-bold text-slate-900 dark:text-white">
                                  {inCart}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Sumar unidad de ${product.name}`}
                                  disabled={full}
                                  onClick={() => changeQuantity(product.id, 1)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                  <Plus className="h-3.5 w-3.5" aria-hidden />
                                </button>
                              </div>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                {formatCurrency(round2(price * inCart), currency)}
                              </span>
                            </div>
                          ) : (
                            <Button
                              className="w-full"
                              variant="secondary"
                              disabled={soldOut}
                              icon={<Plus className="h-4 w-4" aria-hidden />}
                              onClick={() => addToCart(product)}
                              aria-label={
                                soldOut
                                  ? `${product.name} sin stock`
                                  : `Agregar ${product.name} al carrito, ${formatCurrency(price, currency)}`
                              }
                            >
                              {soldOut ? 'Sin stock' : 'Añadir'}
                            </Button>
                          )}
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
        <div className="hidden xl:col-span-1 xl:block">
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
                      icon={<Trash2 className="h-4 w-4" aria-hidden />}
                      onClick={() => setConfirmClearOpen(true)}
                    >
                      Vaciar
                    </Button>
                  ) : undefined
                }
              />
              <CardBody className="space-y-3">
                <CartPanel
                  cart={cart}
                  currency={currency}
                  subtotal={subtotal}
                  units={units}
                  onIncrease={(id) => changeQuantity(id, 1)}
                  onDecrease={(id) => changeQuantity(id, -1)}
                  onRemove={removeLine}
                  showCheckout
                  onCheckout={openCheckout}
                />
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* -------------------- barra fija de carrito (móvil) -------------------- */}
      {units > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 xl:hidden">
          <div className="mx-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-left transition-colors hover:border-primary/50 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 dark:border-slate-700 dark:hover:bg-slate-800/60"
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShoppingCart className="h-5 w-5" aria-hidden />
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-white">
                  {units}
                </span>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                  {units} artículos · Ver carrito
                </span>
                <span className="block text-base font-bold text-slate-900 dark:text-white">
                  {formatCurrency(subtotal, currency)}
                </span>
              </span>
            </button>
            <Button size="lg" icon={<Receipt className="h-4 w-4" aria-hidden />} onClick={openCheckout}>
              Cobrar
            </Button>
          </div>
        </div>
      )}

      {/* --------------------- carrito en modal (móvil/tablet) --------------------- */}
      <Modal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title="Venta actual"
        description={units > 0 ? `${units} artículos · ${cart.length} líneas` : 'Carrito vacío'}
        footer={
          <>
            <Button
              variant="ghost"
              icon={<Trash2 className="h-4 w-4" aria-hidden />}
              onClick={() => {
                setCartOpen(false);
                setConfirmClearOpen(true);
              }}
            >
              Vaciar
            </Button>
            <Button
              icon={<Receipt className="h-4 w-4" aria-hidden />}
              onClick={() => {
                setCartOpen(false);
                openCheckout();
              }}
            >
              Cobrar
            </Button>
          </>
        }
      >
        <CartPanel
          cart={cart}
          currency={currency}
          subtotal={subtotal}
          units={units}
          onIncrease={(id) => changeQuantity(id, 1)}
          onDecrease={(id) => changeQuantity(id, -1)}
          onRemove={removeLine}
          compact
        />
      </Modal>

      <ConfirmDialog
        open={confirmClearOpen}
        title="Vaciar el carrito"
        message={`Se quitarán ${units} ${units === 1 ? 'artículo' : 'artículos'} de la venta actual. Esta acción no se puede deshacer.`}
        confirmLabel="Vaciar carrito"
        cancelLabel="Conservar"
        onConfirm={() => {
          setCart([]);
          setConfirmClearOpen(false);
          setCartOpen(false);
          announceCart([], 'Carrito vaciado');
        }}
        onCancel={() => setConfirmClearOpen(false)}
      />

      {/* ------------------------------- cobro ------------------------------ */}
      <Modal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        title="Cobrar venta"
        description={`${units} artículos · Total ${formatCurrency(total, currency)}`}
        initialFocusRef={cash ? amountRef : undefined}
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setCheckoutOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="checkout-form"
              variant="success"
              icon={<MethodIcon className="h-4 w-4" aria-hidden />}
              loading={createSale.isPending}
            >
              Confirmar pago
            </Button>
          </>
        }
      >
        <form id="checkout-form" onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Descuento</span>
              <span>-{formatCurrency(discount, currency)}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-slate-200 pt-1.5 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total a pagar</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(total, currency)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Método de pago<span className="ml-0.5 text-danger">*</span>
            </span>
            <div role="radiogroup" aria-label="Método de pago" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PAYMENT_METHODS.map((method) => {
                const Icon = METHOD_ICONS[method];
                const selected = paymentMethod === method;
                return (
                  <label
                    key={method}
                    className={cn(
                      'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition-colors',
                      'focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/60',
                      selected
                        ? 'border-primary bg-primary/10 text-primary-700 dark:text-primary-300'
                        : 'border-slate-300 text-slate-600 hover:border-primary/50 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60',
                    )}
                  >
                    <input type="radio" value={method} className="sr-only" {...register('paymentMethod')} />
                    <Icon className="h-5 w-5" aria-hidden />
                    <span>{method}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <Field label="Descuento" htmlFor="pay-discount" hint="Monto a descontar sobre el subtotal">
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
            <div className="space-y-2">
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
                  icon={<Banknote className="h-4 w-4" aria-hidden />}
                  error={errors.amountPaid?.message}
                  {...amountRegister}
                  ref={(node) => {
                    amountRef.current = node;
                    amountRegister.ref(node);
                  }}
                />
              </Field>

              <div className="flex flex-wrap gap-2" role="group" aria-label="Importes rápidos">
                {quickAmounts.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={value === total ? 'primary' : 'outline'}
                    onClick={() =>
                      setValue('amountPaid', value, { shouldDirty: true, shouldValidate: true })
                    }
                  >
                    {value === total ? 'Exacto' : formatCurrency(value, currency)}
                  </Button>
                ))}
                {hasPaid && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setValue('amountPaid', undefined, { shouldDirty: true })}
                  >
                    Borrar importe
                  </Button>
                )}
              </div>

              <div
                role="status"
                aria-live="polite"
                className={cn(
                  'rounded-xl border p-4 text-center',
                  insufficient
                    ? 'border-danger/40 bg-danger/10'
                    : hasPaid
                      ? 'border-success/40 bg-success/10'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40',
                )}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {insufficient ? 'Falta por pagar' : 'Vuelto'}
                </p>
                <p
                  className={cn(
                    'mt-1 text-3xl font-bold',
                    insufficient
                      ? 'text-danger'
                      : hasPaid
                        ? 'text-success-600 dark:text-success-500'
                        : 'text-slate-400 dark:text-slate-500',
                  )}
                >
                  {formatCurrency(insufficient ? missing : change, currency)}
                </p>
                {!hasPaid && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Ingresa el importe recibido para calcular el vuelto.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
              <MethodIcon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
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
          <>
            <Button
              variant="outline"
              icon={<TrendingUp className="h-4 w-4" aria-hidden />}
              onClick={() => {
                setTicket(null);
                navigate(paths.sales);
              }}
            >
              Ver reporte
            </Button>
            <Button
              icon={<Plus className="h-4 w-4" aria-hidden />}
              onClick={() => {
                setTicket(null);
                setCheckoutOpen(false);
              }}
            >
              Nueva venta
            </Button>
          </>
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
                <caption className="sr-only">Detalle de los productos del ticket {ticket.number}</caption>
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
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(ticket.total, currency)}
                </span>
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
