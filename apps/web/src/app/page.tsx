export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 sm:px-10 sm:py-16">
      <header className="flex items-center justify-between border-b border-slate-200 pb-6">
        <span className="text-2xl font-black tracking-tight text-slate-950">90+9</span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
          Altyapı hazır
        </span>
      </header>

      <section className="flex flex-1 flex-col justify-center py-16 sm:py-24">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
          Günlük futbol grid oyunu
        </p>
        <h1 className="max-w-3xl text-4xl leading-tight font-black tracking-tight text-slate-950 sm:text-6xl">
          Türkiye Süper Lig oyuncularını tahmin et, günlük 3×3 gridi tamamla.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          90+9 geliştirme ortamı çalışıyor. Oyun verisi, kural motoru ve günlük grid akışı sıradaki
          aşamalarda bu temel üzerinde kurulacak.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["14 sezon", "2012/13–2025/26 Süper Lig kapsamı"],
            ["3×3 grid", "Her gün herkes için aynı oyun"],
            ["Sınırsız", "Yanlış tahmin hakkı"],
          ].map(([title, description]) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
