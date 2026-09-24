import { Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/tables/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin } from 'lucide-react';

// Leaflet/react-leaflet are code-split out of the main bundle since most pages never render a map.
const LeafletMap = lazy(() => import('./leaflet-map'));

interface MapCardProps {
  latitude?: number | null;
  longitude?: number | null;
  name: string;
  location?: string | null;
}

export function MapCard({ latitude, longitude, name, location }: MapCardProps) {
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Location</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {hasCoords ? (
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <LeafletMap latitude={latitude!} longitude={longitude!} name={name} location={location} />
          </Suspense>
        ) : (
          <EmptyState icon={MapPin} title="No coordinates on file" description="This project has no latitude/longitude set." />
        )}
      </CardContent>
    </Card>
  );
}
