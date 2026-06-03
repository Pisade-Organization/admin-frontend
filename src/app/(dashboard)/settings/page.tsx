import { SettingsPage } from '@/features/settings/components/SettingsPage';

type SettingsRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: SettingsRouteProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <SettingsPage
      searchParams={{
        entity:
          typeof resolvedSearchParams.entity === 'string'
            ? resolvedSearchParams.entity
            : undefined,
      }}
    />
  );
}
