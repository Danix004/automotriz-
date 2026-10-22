import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFieldArray, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Barcode, Plus, Save, Trash2, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Checkbox, Switch } from '@/components/ui/Field';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { productSchema, type ProductFormValues } from '@/schemas';
import { useCategoriesOptions, useProduct, useProductMutations } from '@/hooks/queries';
import { getErrorMessage } from '@/utils/errors';
import { toast } from '@/store/toastStore';
import { paths } from '@/routes/paths';

export function ProductFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = mode === 'edit';
  const { data: product, isLoading } = useProduct(isEdit ? id : undefined);
  const { data: categories } = useCategoriesOptions();
  const mutations = useProductMutations();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      barcode: '',
      name: '',
      description: '',
      categoryId: '',
      brand: '',
      price: 0,
      promotionalPrice: null,
      stock: 0,
      image: '',
      gallery: [],
      specs: [],
      installation: '',
      tags: [],
      active: true,
    },
  });

  const specs = useFieldArray({ control, name: 'specs' });

  useEffect(() => {
    if (!isEdit || !product) return;
    reset({
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      brand: product.brand,
      price: product.price,
      promotionalPrice: product.promotionalPrice,
      stock: product.stock,
      image: product.image,
      gallery: product.gallery,
      specs: product.specs,
      installation: product.installation,
      tags: product.tags,
      active: product.active,
    });
  }, [isEdit, product, reset]);

  const onSubmit: SubmitHandler<ProductFormValues> = (values) => {
    const payload = {
      ...values,
      // El formulario ya no pide SKU: se autogenera para mantener el registro interno.
      sku: values.sku?.trim() || `AE-${Date.now().toString(36).toUpperCase()}`,
      promotionalPrice: values.promotionalPrice ? Number(values.promotionalPrice) : null,
      price: Number(values.price),
      stock: Number(values.stock),
    };

    if (isEdit && id) {
      mutations.update.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            toast.success('Producto actualizado', payload.name);
            navigate(paths.product(id));
          },
          onError: (error) => toast.error('No se pudo guardar', getErrorMessage(error)),
        },
      );
    } else {
      mutations.create.mutate(payload, {
        onSuccess: (created) => {
          toast.success('Producto creado', `${payload.name} se agregó al catálogo.`);
          navigate(paths.product(created.id));
        },
        onError: (error) => toast.error('No se pudo crear', getErrorMessage(error)),
      });
    }
  };

  if (isEdit && isLoading) return <LoadingState label="Cargando producto…" />;
  if (isEdit && !product) return <ErrorState title="Producto no encontrado" />;

  return (
    <div className="space-y-5">
      <PageHeader
        title={isEdit ? 'Editar producto' : 'Nuevo equipamiento'}
        description={isEdit ? 'Actualiza la información del producto' : 'Agrega un producto al catálogo de equipamientos'}
        breadcrumbs={[
          { label: 'Equipamientos', to: paths.products },
          { label: 'Productos', to: paths.products },
          { label: isEdit ? 'Editar' : 'Nuevo' },
        ]}
        actions={
          <>
            <Button variant="ghost" icon={<X className="h-4 w-4" />} onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="product-form"
              icon={<Save className="h-4 w-4" />}
              loading={mutations.create.isPending || mutations.update.isPending || isSubmitting}
            >
              {isEdit ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </>
        }
      />

      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader title="Información básica" description="Identificación del producto en el catálogo" />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nombre" htmlFor="product-name" required error={errors.name?.message}>
                <Input id="product-name" placeholder="Ej. Pantalla multimedia 10.1&quot;" {...register('name')} error={errors.name?.message} />
              </Field>
              <Field
                label="Código de barras"
                htmlFor="product-barcode"
                error={errors.barcode?.message}
                hint="EAN/UPC: escanea el código o escríbelo. Permite cobrar en caja escaneando."
              >
                <Input
                  id="product-barcode"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Ej. 7890000000001"
                  icon={<Barcode className="h-4 w-4" />}
                  {...register('barcode')}
                  error={errors.barcode?.message}
                />
              </Field>
              <Field label="Categoría" htmlFor="product-category" required error={errors.categoryId?.message}>
                <Select
                  id="product-category"
                  placeholder="Seleccionar categoría"
                  {...register('categoryId')}
                  error={errors.categoryId?.message}
                >
                  {categories?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Marca del producto" htmlFor="product-brand" hint="Fabricante del accesorio">
                <Input id="product-brand" placeholder="Ej. Pioneer" {...register('brand')} />
              </Field>
              <Field label="Descripción" htmlFor="product-description" required error={errors.description?.message} className="sm:col-span-2">
                <Textarea
                  id="product-description"
                  placeholder="Describe el producto, materiales, contenido del kit…"
                  {...register('description')}
                  error={errors.description?.message}
                />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Precios y stock" description="Precio, promoción y disponibilidad" />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Precio" htmlFor="product-price" required error={errors.price?.message}>
                <Input id="product-price" type="number" step="0.01" min={0} {...register('price')} error={errors.price?.message} />
              </Field>
              <Field label="Precio promocional" htmlFor="product-promo" error={errors.promotionalPrice?.message} hint="Vacío = sin promo">
                <Input id="product-promo" type="number" step="0.01" min={0} {...register('promotionalPrice')} error={errors.promotionalPrice?.message} />
              </Field>
              <Field label="Stock" htmlFor="product-stock" required error={errors.stock?.message}>
                <Input id="product-stock" type="number" min={0} {...register('stock')} error={errors.stock?.message} />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Especificaciones"
              description="Características clave mostradas en la ficha"
              actions={
                <Button type="button" size="sm" variant="outline" icon={<Plus className="h-4 w-4" />} onClick={() => specs.append({ label: '', value: '' })}>
                  Agregar
                </Button>
              }
            />
            <CardBody className="space-y-3">
              {specs.fields.length === 0 && (
                <p className="text-sm text-slate-500">Sin especificaciones. Agrega pares de campo/valor.</p>
              )}
              {specs.fields.map((field, index) => (
                <div key={field.id} className="flex flex-col gap-2 sm:flex-row">
                  <Input placeholder="Ej. Pantalla" {...register(`specs.${index}.label`)} />
                  <Input placeholder="Ej. 10.1&quot; IPS" {...register(`specs.${index}.value`)} className="sm:flex-1" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => specs.remove(index)} aria-label="Eliminar especificación">
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              ))}
            </CardBody>
          </Card>

        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Instalación y etiquetas" />
            <CardBody className="space-y-4">
              <Field label="Instrucciones de instalación" htmlFor="product-installation">
                <Textarea id="product-installation" placeholder="Tiempo estimado, herramientas, conexiones…" {...register('installation')} />
              </Field>
              <Field label="Etiquetas" htmlFor="product-tags" hint="Separadas por comas: android auto, cámara">
                <Input
                  id="product-tags"
                  placeholder="multimedia, pantalla"
                  defaultValue=""
                  {...register('tags', {
                    setValueAs: (value: unknown) =>
                      Array.isArray(value)
                        ? value
                        : typeof value === 'string'
                          ? value.split(',').map((tag) => tag.trim()).filter(Boolean)
                          : [],
                  })}
                />
              </Field>
              <Checkbox
                label="Producto activo"
                description="Visible en el catálogo y en los buscadores"
                defaultChecked
                {...register('active')}
              />
              <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3">
                <span className="text-sm text-slate-600 dark:text-slate-300">Publicar ahora</span>
                <Switch checked={watch('active')} onChange={(value) => setValue('active', value, { shouldDirty: true })} />
              </div>
            </CardBody>
          </Card>
        </div>
      </form>
    </div>
  );
}
