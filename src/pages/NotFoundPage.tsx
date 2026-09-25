import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import { paths } from '@/routes/paths';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <EmptyState
          icon={<Compass className="h-7 w-7" />}
          title="Página no encontrada"
          description="La ruta que buscas no existe o fue movida. Vuelve al dashboard para continuar."
        />
        <div className="mt-4 flex justify-center gap-3">
          <Button variant="outline" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(-1)}>
            Volver
          </Button>
          <Link to={paths.dashboard}>
            <Button>Ir al dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
