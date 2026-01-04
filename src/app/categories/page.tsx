import CategoryManager from '@/components/categories/CategoryManager';
import { getCategories } from '@/lib/actions';

export default async function CategoriesPage() {
  // Al llamar a getCategories, si no existen, las creará automáticamente
  const categories = await getCategories();

  return (
    <main className="p-4 md:p-8 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <CategoryManager initialData={categories as any} />
      </div>
    </main>
  );
}