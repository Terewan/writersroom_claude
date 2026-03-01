export default async function CharacterDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; characterId: string }>;
}) {
  const { characterId } = await params;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold">Character Detail</h2>
      <p className="mt-2 text-muted-foreground">
        Character profile for {characterId}
      </p>
    </div>
  );
}
