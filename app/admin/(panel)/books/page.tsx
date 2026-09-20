import { Save } from "lucide-react";
import { updateBookAction } from "@/app/admin/actions";
import { getBooks } from "@/lib/db";
import { hasSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Lets the team fill in the catalogue without touching code: who presents
 * each book, its trailer, and how many copies are available to lend.
 *
 * Title, author and synopsis are deliberately left out — they are settled
 * content, and an accidental edit on the day would show up on the public
 * landing page straight away.
 */
export default async function BooksAdminPage() {
  const books = await getBooks();
  const editable = hasSupabase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Libros</h1>
        <p className="mt-1 text-sm text-mist">
          Lo que edites aquí aparece de inmediato en la página pública.
        </p>
      </div>

      {!editable && (
        <p className="card border-magenta/40 p-5 text-sm text-parchment">
          Sin base de datos configurada, el catálogo se lee del código y no se puede editar.
        </p>
      )}

      <div className="space-y-5">
        {books.map((book) => (
          <form
            key={book.slug}
            action={updateBookAction.bind(null, book.slug)}
            className="card space-y-4 p-6"
          >
            <div>
              <h2 className="font-display text-xl text-parchment">{book.title}</h2>
              <p className="text-sm text-mist">{book.author}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-parchment">
                  Expositor
                </span>
                <input
                  name="presenter"
                  defaultValue={book.presenter ?? ""}
                  placeholder="Nombre de quien presenta"
                  className="w-full rounded-(--radius-soft) border border-edge bg-night/70 px-4 py-3 text-parchment placeholder:text-mist/50 focus:border-gold/60 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-parchment">
                  Ejemplares para prestar
                </span>
                <input
                  name="copies"
                  type="number"
                  min={0}
                  max={99}
                  defaultValue={1}
                  className="w-full rounded-(--radius-soft) border border-edge bg-night/70 px-4 py-3 text-parchment focus:border-gold/60 focus:outline-none"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-parchment">
                Book trailer (enlace de YouTube)
              </span>
              <input
                name="trailerUrl"
                defaultValue={book.trailer ?? ""}
                placeholder="https://youtu.be/…"
                className="w-full rounded-(--radius-soft) border border-edge bg-night/70 px-4 py-3 text-parchment placeholder:text-mist/50 focus:border-gold/60 focus:outline-none"
              />
              <span className="mt-1.5 block text-xs text-mist/70">
                Sube el video a YouTube como &ldquo;No listado&rdquo; y pega el enlace aquí.
              </span>
            </label>

            <button
              type="submit"
              disabled={!editable}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-midnight transition-transform hover:scale-[1.03] disabled:opacity-50"
            >
              <Save aria-hidden className="size-[1.15em]" />
              <span className="leading-none">Guardar</span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
