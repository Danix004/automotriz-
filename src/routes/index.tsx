/**
 * Definición de rutas de la aplicación.
 * Todas las páginas se cargan de forma diferida (code splitting con Vite)
 * para que el bundle inicial sea mínimo.
 */

import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingState } from '@/components/ui/States';
import { paths } from '@/routes/paths';

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const BrandsPage = lazy(() => import('@/pages/BrandsPage').then((m) => ({ default: m.BrandsPage })));
const BrandDetailPage = lazy(() => import('@/pages/BrandDetailPage').then((m) => ({ default: m.BrandDetailPage })));
const ModelsPage = lazy(() => import('@/pages/ModelsPage').then((m) => ({ default: m.ModelsPage })));
const VehiclesPage = lazy(() => import('@/pages/VehiclesPage').then((m) => ({ default: m.VehiclesPage })));
const VehicleDetailPage = lazy(() =>
  import('@/pages/VehicleDetailPage').then((m) => ({ default: m.VehicleDetailPage })),
);
const VehicleFormPage = lazy(() =>
  import('@/pages/VehicleFormPage').then((m) => ({ default: m.VehicleFormPage })),
);
const ProductsPage = lazy(() => import('@/pages/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() =>
  import('@/pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })),
);
const ProductFormPage = lazy(() => import('@/pages/ProductFormPage').then((m) => ({ default: m.ProductFormPage })));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })));
const CompatibilityPage = lazy(() =>
  import('@/pages/CompatibilityPage').then((m) => ({ default: m.CompatibilityPage })),
);
const SearchPage = lazy(() => import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const CashRegisterPage = lazy(() =>
  import('@/pages/CashRegisterPage').then((m) => ({ default: m.CashRegisterPage })),
);
const SalesReportPage = lazy(() => import('@/pages/SalesReportPage').then((m) => ({ default: m.SalesReportPage })));
const UsersPage = lazy(() => import('@/pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingState label="Cargando módulo…" />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to={paths.dashboard} replace />} />

          <Route path="dashboard" element={<DashboardPage />} />

          <Route path="brands">
            <Route index element={<BrandsPage />} />
            <Route path=":id" element={<BrandDetailPage />} />
          </Route>

          <Route path="models" element={<ModelsPage />} />

          <Route path="vehicles">
            <Route index element={<VehiclesPage />} />
            <Route path="new" element={<VehicleFormPage mode="create" />} />
            <Route path=":id" element={<VehicleDetailPage />} />
            <Route path=":id/edit" element={<VehicleFormPage mode="edit" />} />
          </Route>

          <Route path="products">
            <Route index element={<ProductsPage />} />
            <Route path="new" element={<ProductFormPage mode="create" />} />
            <Route path=":id" element={<ProductDetailPage />} />
            <Route path=":id/edit" element={<ProductFormPage mode="edit" />} />
          </Route>

          <Route path="categories" element={<CategoriesPage />} />
          <Route path="compatibility" element={<CompatibilityPage />} />
          <Route path="caja" element={<CashRegisterPage />} />
          <Route path="ventas" element={<SalesReportPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
