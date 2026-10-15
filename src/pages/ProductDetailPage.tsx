import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Car, Copy, Link2, Pencil, Tags, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge, StockBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { SmartImage } from '@/components/shared/SmartImage';
import { ProductCard } from '@/components/shared/ProductCard';
import { VehicleRow } from '@/components/shared/VehicleCard';
import { useProduct, useProductMutations, useSettings } from '@/hooks/queries';
import { groupBy } from '@/utils/array';
import { placeholderImage } from '@/utils/placeholder';
import { formatCurrency, formatDate, formatNumber, relativeTime } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import { toast } from '@/store/toastStore';
import { paths } from '@/routes/paths';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, isError, refetch } = useProduct(id);
  const mutations = useProductMutations();
  const { data: settings } = useSettings();
  const [imageIndex, setImageIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const gallery = useMemo(() => {
    if (!product) return [];
    const items = [product.image, ...product.gallery].filter((url): url is string => Boolean(url));
    return items.length > 0 ? items : ['', '', ''];
  }, [product]);

  const vehiclesByBrand = useMemo(() => {
    if (!product) return {};
    return groupBy(product.vehicles, (vehicle) => vehicle.brand?.name ?? 'Sin marca');
  }, [product]);

  if (isLoading) return <LoadingState label="Cargando producto…" />;
  if (isError || !product) return <ErrorState title="Producto no encontrado" onRetry={() => void refetch()} />;

  const currency = settings?.currency ?? 'USD';
  const discounted = product.promotionalPrice !== null && product.promotionalPrice < product.price;
  const finalPrice = discounted ? (product.promotionalPrice as number) : product.price;

  const handleDuplicate = () => {
    mutations.duplicate.mutate(product.id, {
      onSuccess: (copy) => {
        toast.success('Producto duplicado', `Se creó “${copy.name}” como borrador.`);
        navigate(paths.product(copy.id));
      },
      onError: (error) => toast.error('No se pudo duplicar', getErrorMessage(error)),
    });
  };

  const handleDelete = () => {
    mutations.remove.mutate(product.id, {
      onSuccess: () => {
        toast.success('Producto eliminado', `${product.name} fue eliminado.`);
        navigate(paths.products);
      },
      onError: (error) => {
        toast.error('No se pudo eliminar', getErrorMessage(error));
        setConfirmDelete(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-3">
            <Link
              to={paths.products}
              aria-label="Volver al catálogo"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {product.name}
          </span>
        }
        description={`SKU ${product.sku}${product.barcode ? ` · EAN ${product.barcode}` : ''} · ${product.brand || 'Marca no especificada'} · actualizado ${relativeTime(product.updatedAt)}`}
        breadcrumbs={[
          { label: 'Equipamientos', to: paths.products },
          { label: 'Productos', to: paths.products },
          { label: product.name },
        ]}
        actions={
          <>
            <Button variant="outline" icon={<Copy className="h-4 w-4" />} onClick={handleDuplicate} loading={mutations.duplicate.isPending}>
              Duplicar
            </Button>
            <Button
              variant="outline"
              icon={<Link2 className="h-4 w-4" />}
              onClick={() => navigate(`${paths.compatibility}?productId=${product.id}`)}
            >
              Agregar compatibilidad
            </Button>
            <Button variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => navigate(paths.productEdit(product.id))}>
              Editar
            </Button>
            <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmDelete(true)}>
              Eliminar
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {/* Galería */}
        <Card className="xl:col-span-2">
          <CardBody className="space-y-3">
            <div className="aspect-[16/11] overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
              <SmartImage
                src={gallery[imageIndex]}
                alt={product.name}
                fallback={() => placeholderImage(product.name, product.category.name)}
                className="h-full w-full"
              />
            </div>
            <div className="flex gap-2">
              {gallery.map((url, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setImageIndex(index)}
                  aria-label={`Imagen ${index + 1}`}
                  className={`h-16 w-20 overflow-hidden rounded-md border-2 transition-colors ${
                    index === imageIndex ? 'border-primary' : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <SmartImage
                    src={url}
                    alt={`${product.name} ${index + 1}`}
                    fallback={() => placeholderImage(`${product.name} ${index + 1}`)}
                    className="h-full w-full"
                    decorative
                  />
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Resumen */}
        <div className="space-y-4 xl:col-span-3">
          <Card>
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">{product.category.name}</Badge>
                <StatusBadge active={product.active} labels={['Publicado', 'Borrador']} />
                <StockBadge stock={product.stock} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {product.sku}
                  {product.barcode && (
                    <span className="ml-2 normal-case tracking-normal">· EAN {product.barcode}</span>
                  )}
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{product.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{product.description}</p>
              </div>

              <div className="flex items-end gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
                <div>
                  {discounted && (
                    <p className="text-sm text-slate-400 line-through">{formatCurrency(product.price, currency)}</p>
                  )}
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(finalPrice, currency)}</p>
                </div>
                {discounted && (
                  <Badge variant="danger">
                    -{Math.round((1 - finalPrice / product.price) * 100)}% de descuento
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoBox label="Marca" value={product.brand || '—'} />
                <InfoBox label="Categoría" value={product.category.name} />
                <InfoBox label="Stock" value={String(product.stock)} />
                <InfoBox label="Compatibilidades" value={formatNumber(product.vehicles.length)} />
                <InfoBox label="Creado" value={formatDate(product.createdAt)} />
                <InfoBox label="Actualizado" value={formatDate(product.updatedAt)} />
              </div>

              {product.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Tags className="h-4 w-4 text-slate-400" />
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="neutral">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Especificaciones" description="Ficha técnica del equipamiento" />
            <CardBody className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {product.specs.length === 0 && <p className="text-sm text-slate-500">Sin especificaciones registradas.</p>}
              {product.specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2"
                >
                  <span className="text-xs text-slate-500">{spec.label}</span>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{spec.value}</span>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Instalación" description="Indicaciones para el taller" />
            <CardBody>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {product.installation || 'Consultar con el técnico especializado antes de la instalación.'}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Vehículos compatibles */}
      <Card>
        <CardHeader
          title={`Vehículos compatibles (${formatNumber(product.vehicles.length)})`}
          description="Relación marca → modelo → generación → año → versión"
          actions={
            <Button size="sm" variant="outline" icon={<Link2 className="h-4 w-4" />} onClick={() => navigate(`${paths.compatibility}?productId=${product.id}`)}>
              Editar compatibilidad
            </Button>
          }
        />
        <CardBody>
          {product.vehicles.length === 0 ? (
            <EmptyState
              icon={<Car className="h-7 w-7" />}
              title="Sin vehículos compatibles"
              description="Asocia este producto con los vehículos donde puede instalarse."
              action={
                <Button onClick={() => navigate(`${paths.compatibility}?productId=${product.id}`)}>
                  Agregar compatibilidad
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {Object.entries(vehiclesByBrand).map(([brandName, vehicles]) => (
                <div key={brandName} className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{brandName}</h4>
                  <div className="space-y-1.5">
                    {vehicles.map((vehicle) => (
                      <Link
                        key={vehicle.id}
                        to={paths.vehicle(vehicle.id)}
                        className="block rounded-lg border border-slate-200 dark:border-slate-800 p-3 transition-colors hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <VehicleRow vehicle={vehicle} />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Relacionados */}
      {product.related.length > 0 && (
        <Card>
          <CardHeader title="Productos relacionados" description="Misma categoría o fabricante" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            {product.related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </CardBody>
        </Card>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar producto?"
        message={`Se eliminará “${product.name}” junto con todas sus compatibilidades.`}
        loading={mutations.remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}
