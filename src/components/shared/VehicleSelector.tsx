import { useEffect, useMemo } from 'react';
import type { VehicleWithRefs } from '@/types';
import { useBrandsOptions, useGenerationsByModel, useModelsByBrand, useVehicles } from '@/hooks/queries';
import { Field } from '@/components/ui/Field';
import { Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/States';

export interface VehicleSelection {
  brandId: string;
  modelId: string;
  generationId: string;
  year: string;
  vehicleId: string;
}

export const EMPTY_SELECTION: VehicleSelection = {
  brandId: '',
  modelId: '',
  generationId: '',
  year: '',
  vehicleId: '',
};

export interface VehicleSelectorProps {
  value: VehicleSelection;
  onChange: (value: VehicleSelection) => void;
  onVehiclesLoaded?: (vehicles: VehicleWithRefs[]) => void;
  /** Oculta los selects de año y versión (cuando solo interesan marca/modelo/generación). */
  compact?: boolean;
  showVersion?: boolean;
  labelPrefix?: string;
  columns?: 1 | 2 | 3 | 4;
  disabled?: boolean;
}

const columnClass = {
  1: 'grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

/**
 * Selector en cascada: Marca → Modelo → Generación → Año → Versión.
 * Emite el vehículo completo resuelto y la lista cargada.
 */
export function VehicleSelector({
  value,
  onChange,
  onVehiclesLoaded,
  compact = false,
  showVersion = true,
  labelPrefix = '',
  columns = 4,
  disabled = false,
}: VehicleSelectorProps) {
  const { data: brands, isLoading: loadingBrands } = useBrandsOptions();
  const { data: models, isLoading: loadingModels } = useModelsByBrand(value.brandId || undefined);
  const { data: generations, isLoading: loadingGenerations } = useGenerationsByModel(
    value.modelId || undefined,
  );
  const { data: vehiclesPage, isLoading: loadingVehicles } = useVehicles({
    generationId: value.generationId,
    pageSize: 0,
    sortField: 'year',
    sortDirection: 'desc',
  });

  const vehicles = useMemo(() => vehiclesPage?.items ?? [], [vehiclesPage]);

  const years = useMemo(() => {
    const unique = new Set(vehicles.map((vehicle) => vehicle.year));
    return [...unique].sort((a, b) => b - a);
  }, [vehicles]);

  const versions = useMemo(() => {
    const filtered = value.year ? vehicles.filter((v) => String(v.year) === value.year) : vehicles;
    return [...new Map(filtered.map((v) => [v.version, v])).values()];
  }, [vehicles, value.year]);

  useEffect(() => {
    onVehiclesLoaded?.(vehicles);
  }, [vehicles, onVehiclesLoaded]);

  const update = (patch: Partial<VehicleSelection>) => onChange({ ...value, ...patch });

  return (
    <div className={`grid grid-cols-1 gap-4 ${columnClass[columns]}`}>
      <Field label={`${labelPrefix}Marca`} htmlFor="selector-brand">
        <Select
          id="selector-brand"
          placeholder="Seleccionar marca"
          value={value.brandId}
          disabled={disabled || loadingBrands}
          onChange={(event) =>
            update({ brandId: event.target.value, modelId: '', generationId: '', year: '', vehicleId: '' })
          }
        >
          {brands?.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={`${labelPrefix}Modelo`} htmlFor="selector-model">
        <Select
          id="selector-model"
          placeholder={value.brandId ? 'Seleccionar modelo' : 'Elige una marca'}
          value={value.modelId}
          disabled={disabled || !value.brandId || loadingModels}
          onChange={(event) => update({ modelId: event.target.value, generationId: '', year: '', vehicleId: '' })}
        >
          {models?.items.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={`${labelPrefix}Generación`} htmlFor="selector-generation">
        <Select
          id="selector-generation"
          placeholder={value.modelId ? 'Seleccionar generación' : 'Elige un modelo'}
          value={value.generationId}
          disabled={disabled || !value.modelId || loadingGenerations}
          onChange={(event) => update({ generationId: event.target.value, year: '', vehicleId: '' })}
        >
          {generations?.map((generation) => (
            <option key={generation.id} value={generation.id}>
              {generation.name} ({generation.startYear}–{generation.endYear ?? 'actual'})
            </option>
          ))}
        </Select>
      </Field>

      {!compact && (
        <Field label={`${labelPrefix}Año`} htmlFor="selector-year">
          <Select
            id="selector-year"
            placeholder={value.generationId ? 'Seleccionar año' : 'Elige una generación'}
            value={value.year}
            disabled={disabled || !value.generationId || loadingVehicles}
            onChange={(event) => update({ year: event.target.value, vehicleId: '' })}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {!compact && showVersion && (
        <Field label={`${labelPrefix}Versión`} htmlFor="selector-version">
          <Select
            id="selector-version"
            placeholder={value.year ? 'Seleccionar versión' : 'Elige un año'}
            value={value.vehicleId}
            disabled={disabled || !value.year}
            onChange={(event) => update({ vehicleId: event.target.value })}
          >
            {versions.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.version} · {vehicle.engine}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {loadingVehicles && value.generationId && (
        <div className="col-span-full flex items-center gap-2 text-xs text-slate-400">
          <Spinner className="h-4 w-4" /> Cargando vehículos…
        </div>
      )}
    </div>
  );
}
