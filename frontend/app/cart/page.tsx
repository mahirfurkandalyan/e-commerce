import { CartView } from "@/components/cart/cart-view";
import { SiteShell } from "@/components/layout/site-shell";

export default function CartPage() {
  return (
    <SiteShell
      eyebrow="Sepet Özeti"
      title="Ödeme öncesi seçimlerinizi gözden geçirin."
      description="Temiz adet kontrolleri, şeffaf fiyatlandırma ve doğrudan ödeme adımına geçiş için sade bir özet ekranı."
      heroTone="compact"
    >
      <CartView />
    </SiteShell>
  );
}
