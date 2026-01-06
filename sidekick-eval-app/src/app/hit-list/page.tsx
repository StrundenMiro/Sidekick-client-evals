import { getAllIssues } from '@/lib/runs';
import Breadcrumbs from '@/components/Breadcrumbs';
import HitListClient from './HitListClient';

export default function HitListPage() {
  const themes = getAllIssues();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <Breadcrumbs items={[
          { label: 'Frank', href: '/' },
          { label: "Frank's Hit List" }
        ]} />

        <HitListClient themes={themes} />
      </div>
    </main>
  );
}
