import { Link } from 'react-router-dom';
import { Heart, Pencil, ShoppingCart } from 'lucide-react';
import type { ProductWithCategory } from '@/types';
import { StockBadge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/format';
import { paths } from '@/routes/paths';
import { cn } from '@/utils/cn';
import { useSettings } from '@/hooks/queries';

/** Moneda activa definida en Configuración. */
function useCurrency(): string {
  const { data } = useSettings();
  return data?.currency ?? 'USD';
}

export interface ProductCardProps {
  product: ProductWithCategory;
  className?: string;
  /** Muestra acciones rápidas de administración. */
  admin?: boolean;
}

/** Tarjeta de producto/equipamiento usada en catálogo, buscador y recomendaciones. */
export function ProductCard({ product, className, admin = false }: ProductCardProps) {
  const currency = useCurrency();
  const discounted = product.promotionalPrice !== null && product.promotionalPrice < product.price;
  const finalPrice = discounted ? (product.promotionalPrice as number) : product.price;

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70',
        'shadow-card dark:shadow-card-dark transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg',
        className,
      )}
    >
      <div className="flex items-center gap-2 px-4 pt-4">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {product.category.name}
        </span>
        {discounted && (
          <span className="rounded-md bg-danger px-2 py-0.5 text-[11px] font-semibold text-white">
            -{Math.round((1 - finalPrice / product.price) * 100)}%
          </span>
        )}
        {!product.active && (
          <span className="ml-auto rounded-md bg-slate-700 px-2 py-0.5 text-[11px] font-semibold text-white">
            Inactivo
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
            <span className="font-mono">{product.sku}</span>
            <span className="truncate">{product.brand}</span>
          </div>
          <Link to={paths.product(product.id)}>
            <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white hover:text-primary">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <StockBadge stock={product.stock} />
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div>
            {discounted && (
              <p className="text-xs text-slate-400 line-through">{formatCurrency(product.price, currency)}</p>
            )}
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(finalPrice, currency)}</p>
          </div>
          <div className="flex items-center gap-1">
            {admin ? (
              <>
                <Link
                  to={paths.productEdit(product.id)}
                  aria-label="Editar producto"
                  className="rounded-lg p-2 text-slate-400 hover:bg-primary/10 hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <Link
                  to={paths.product(product.id)}
                  aria-label="Ver producto"
                  className="rounded-lg p-2 text-slate-400 hover:bg-primary/10 hover:text-primary"
                >
                  <Heart className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <Link
                to={paths.product(product.id)}
                aria-label="Ver producto"
                className="rounded-lg p-2 text-slate-400 hover:bg-primary/10 hover:text-primary"
              >
                <ShoppingCart className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
