import { CheckoutForm } from "@/components/checkout/checkout-form";
import { SiteShell } from "@/components/layout/site-shell";

export default function CheckoutPage() {
  return (
    <SiteShell
      eyebrow="Güvenli Ödeme"
      title="Birkaç net ve zarif adımda siparişinizi tamamlayın."
      description="Teslimat bilgilerini girin, ödeme yöntemini seçin ve mağazadaki sade deneyimi ödeme adımında da sürdürün."
      heroTone="compact"
    >
      <CheckoutForm />
    </SiteShell>
  );
}
