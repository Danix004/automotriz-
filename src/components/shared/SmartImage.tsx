import { useState } from 'react';
import { cn } from '@/utils/cn';
import { placeholderImage } from '@/utils/placeholder';

interface SmartImageProps {
  src?: string;
  alt: string;
  /** Generador de imagen de respaldo (data URI SVG) si no hay src o falla. */
  fallback?: () => string;
  className?: string;
  /** Marca si la imagen es decorativa. */
  decorative?: boolean;
}

/**
 * Imagen con fallback automático: si no hay URL o no carga,
 * muestra una imagen generada localmente (funciona offline).
 */
export function SmartImage({ src, alt, fallback, className, decorative }: SmartImageProps) {
  const [errored, setErrored] = useState(false);
  const resolved = fallback ? fallback() : placeholderImage(alt);
  const finalSrc = !src || errored ? resolved : src;

  return (
    <img
      src={finalSrc}
      alt={decorative ? '' : alt}
      loading="lazy"
      onError={() => setErrored(true)}
      className={cn('object-cover', className)}
    />
  );
}
