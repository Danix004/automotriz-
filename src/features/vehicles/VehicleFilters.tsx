import { useMemo } from 'react';
import { X } from 'lucide-react';
import { useVehicles } from '@/hooks/queries';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { VehicleSelector, type VehicleSelection } from '@/components/shared/VehicleSelector';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BODY_TYPES, DRIVETRAIN_TYPES, FUEL_TYPES, TRANSMISSION_TYPES } from '@/types/constants';

const FILTER_KEYS = [
  'brandId',
  'modelId',
  'generationId',
  'year',
  'version',
  'engine',
  'bodyType',
  'fuel',
  'transmission',
  'drivetrain',
];

const EMPTY_FILTERS = {
  brandId: '',
  modelId: '',
  generationId: '',
  year: '',
  version: '',
  engine: '',
  bodyType: '',
  fuel: '',
  transmission: '',
  drivetrain: '',
};

/** Estado del buscador de vehículos, persistido en la URL. */
export function useVehicleFilters() {
  const { filters, setFilter, clearFilters } = useUrlFilters(EMPTY_FILTERS);

  const selection: VehicleSelection = useMemo(
    () => ({
      brandId: filters.brandId,
      modelId: filters.modelId,
      generationId: filters.generationId,
      year: filters.year,
      vehicleId: filters.version,
    }),
    [filters],
  );

  const { data: vehicles } = useVehicles({
    generationId: filters.generationId || undefined,
    year: filters.year || undefined,
    pageSize: 0,
  });

  const engines = useMemo(() => [...new Set((vehicles?.items ?? []).map((vehicle) => vehicle.engine))], [vehicles]);
  const activeCount = FILTER_KEYS.filter((key) => filters[key]).length;

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (filters.brandId) params.brandId = filters.brandId;
    if (filters.modelId) params.modelId = filters.modelId;
    if (filters.generationId) params.generationId = filters.generationId;
    if (filters.year) params.year = filters.year;
    if (filters.bodyType) params.bodyType = filters.bodyType;
    if (filters.fuel) params.fuel = filters.fuel;
    if (filters.transmission) params.transmission = filters.transmission;
    if (filters.drivetrain) params.drivetrain = filters.drivetrain;
    if (filters.version) params.version = filters.version;
    if (filters.engine) params.engine = filters.engine;
    return params;
  }, [filters]);

  return { filters, selection, engines, activeCount, setFilter, clearFilters, queryParams };
}

/**
 * Panel en cascada Marca → Modelo → Generación → Año → Versión → Motor
 * más filtros técnicos. Pensado para el catálogo de vehículos.
 */
export function VehicleFilters() {
  const { filters, selection, engines, activeCount, setFilter, clearFilters } = useVehicleFilters();

  return (
    <FilterPanel title="Buscador de vehículos" activeCount={activeCount} onClear={() => clearFilters(FILTER_KEYS)}>
      <div className="col-span-full">
        <VehicleSelector
          value={selection}
          onChange={(next) => {
            setFilter('brandId', next.brandId, { resetPage: false });
            setFilter('modelId', next.modelId, { resetPage: false });
            setFilter('generationId', next.generationId, { resetPage: false });
            setFilter('year', next.year, { resetPage: false });
            setFilter('version', next.vehicleId);
          }}
          columns={4}
        />
      </div>

      <div className="col-span-full grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SelectField
          label="Motor"
          value={filters.engine}
          disabled={!filters.generationId}
          placeholder={filters.generationId ? 'Cualquier motor' : 'Elige una generación'}
          onChange={(value) => setFilter('engine', value)}
          options={engines}
        />
        <SelectField
          label="Carrocería"
          value={filters.bodyType}
          placeholder="Todas"
          onChange={(value) => setFilter('bodyType', value)}
          options={BODY_TYPES}
        />
        <SelectField
          label="Combustible"
          value={filters.fuel}
          placeholder="Todos"
          onChange={(value) => setFilter('fuel', value)}
          options={FUEL_TYPES}
        />
        <SelectField
          label="Transmisión"
          value={filters.transmission}
          placeholder="Todas"
          onChange={(value) => setFilter('transmission', value)}
          options={TRANSMISSION_TYPES}
        />
        <SelectField
          label="Tracción"
          value={filters.drivetrain}
          placeholder="Todas"
          onChange={(value) => setFilter('drivetrain', value)}
          options={DRIVETRAIN_TYPES}
        />
      </div>

      {activeCount > 0 && (
        <div className="col-span-full flex justify-end">
          <Button size="sm" variant="ghost" icon={<X className="h-3.5 w-3.5" />} onClick={() => clearFilters(FILTER_KEYS)}>
            Limpiar selección
          </Button>
        </div>
      )}
    </FilterPanel>
  );
}

function SelectField({
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      <Select placeholder={placeholder} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </div>
  );
}
