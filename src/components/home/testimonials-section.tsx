import { Quote, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function TestimonialsSection() {
  const t = await getTranslations("home");

  const testimonials =
    t("ctaTitle") === "Ready to find your dream property?"
      ? [
          {
            name: "Mohammed Al Ahmad",
            role: "Investor — Palm Jumeirah",
            text: "Al Maktab Al Aqari exceeded every expectation. From the first viewing to the final signature, everything was handled with world-class professionalism.",
          },
          {
            name: "Sarah Al Khalidi",
            role: "Homeowner — Downtown Dubai",
            text: "The team found us a penthouse that matched our vision perfectly. Truly a premium experience from start to finish.",
          },
          {
            name: "Khaled Al Otaibi",
            role: "Business Owner — Business Bay",
            text: "Their market knowledge is outstanding. They negotiated a deal that saved us significantly. Highly recommended.",
          },
        ]
      : [
          {
            name: "محمد الأحمد",
            role: "مستثمر — نخلة جميرا",
            text: "تجاوز المكتب العقاري كل توقعاتنا. من أول معاينة حتى التوقيع النهائي، كان كل شيء باحترافية عالمية.",
          },
          {
            name: "سارة الخالدي",
            role: "مالكة — داون تاون دبي",
            text: "وجد الفريق لنا بنتهاوس يطابق رؤيتنا تمامًا. تجربة فاخرة فعلًا من البداية إلى النهاية.",
          },
          {
            name: "خالد العتيبي",
            role: "صاحب شركة — بيزنس باي",
            text: "معرفتهم بالسوق استثنائية. تفاوضوا على صفقة وفّرت لنا مبلغًا كبيرًا. أنصح بهم بشدة.",
          },
        ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gold">
          {t("testimonialsSubtitle")}
        </p>
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
          {t("testimonialsTitle")}
        </h2>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
        {testimonials.map((item) => (
          <figure
            key={item.name}
            className="relative rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <Quote className="absolute top-5 rtl:left-5 ltr:right-5 h-8 w-8 text-gold/20" aria-hidden="true" />
            <div className="mb-3 flex gap-0.5" aria-label="5 stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-gold text-gold" aria-hidden="true" />
              ))}
            </div>
            <blockquote className="text-sm leading-relaxed text-muted-foreground">
              “{item.text}”
            </blockquote>
            <figcaption className="mt-4 border-t border-border pt-3">
              <p className="font-bold">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.role}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
