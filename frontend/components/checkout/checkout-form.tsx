"use client";

import { FormEvent, useState } from "react";

import { buildWhatsAppUrl, createAuthenticatedOrder, createOrder } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store";
import { useAuthStore } from "@/store/auth";
import { useToastStore } from "@/store/toast";

export function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const token = useAuthStore((state) => state.token);
  const showToast = useToastStore((state) => state.showToast);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"whatsapp" | "card" | "cash">("whatsapp");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState("");

  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (items.length === 0) {
      setError("Sepetiniz boş.");
      showToast({
        title: "Sepet boş",
        description: "Ödemeye geçmeden önce ürün ekleyin.",
        tone: "error",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setPaymentNotice("");

      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        payment_method: paymentMethod,
        items: items.map((item) => ({
          product: item.slug,
          quantity: item.quantity,
        })),
      };

      const order = token ? await createAuthenticatedOrder(payload, token) : await createOrder(payload);

      clearCart();

      if (order.payment_flow === "whatsapp" && order.whatsapp_message) {
        showToast({
          title: "Sipariş oluşturuldu",
          description: "WhatsApp'a yönlendiriliyorsunuz.",
          tone: "success",
        });
        window.setTimeout(() => {
          window.location.assign(buildWhatsAppUrl(order.whatsapp_message!));
        }, 250);
        return;
      }

      if (order.payment_flow === "card") {
        const paymentPageUrl = order.payment_session?.payment_page_url;
        if (paymentPageUrl) {
          showToast({
            title: "Odeme baslatildi",
            description: "Iyzico test sayfasina yonlendiriliyorsunuz.",
            tone: "success",
          });
          window.location.assign(paymentPageUrl);
          return;
        }

        setPaymentNotice(order.payment_message || "Odeme oturumu baslatilamadi.");
        showToast({
          title: "Odeme baslatilamadi",
          description: "Iyzico odeme linki alinamadi.",
          tone: "error",
        });
        return;
      }

      setPaymentNotice(order.payment_message);
      showToast({
        title: "Sipariş alındı",
        description: "Kapıda ödeme bu sipariş için kaydedildi.",
        tone: "success",
      });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Sipariş oluşturulamadı.";
      setError(message);
      showToast({
        title: "Ödeme başarısız",
        description: message,
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <section className="soft-panel rounded-[1.5rem] p-6 text-center sm:rounded-[2rem] sm:p-10">
        <h2 className="editorial-title text-3xl text-[#111111] sm:text-4xl">Ödeme için önce ürün seçmelisiniz.</h2>
        <p className="mt-4 text-sm text-[#666666]">Sipariş oluşturmadan önce kataloğa dönüp ürün ekleyin.</p>
      </section>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <form onSubmit={handleSubmit} className="soft-panel rounded-[1.35rem] p-4 sm:rounded-[1.6rem] sm:p-8">
        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#888888]">Ödeme</p>
            <h2 className="editorial-title text-3xl leading-[1] text-[#111111] sm:text-5xl sm:leading-[0.95]">Sakin ve net son adım.</h2>
            <p className="max-w-xl text-sm leading-7 text-[#666666]">
              Teslimat bilgilerini girin, ödeme yöntemini seçin ve siparişinizi zahmetsizce tamamlayın.
            </p>
          </div>

          <div className="grid gap-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#333333]">Ad soyad</span>
              <input
                required
                minLength={3}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 outline-none focus:border-[#dcc4aa]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#333333]">Telefon</span>
              <input
                required
                minLength={8}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 outline-none focus:border-[#dcc4aa]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#333333]">Adres</span>
              <textarea
                required
                rows={5}
                minLength={10}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 outline-none focus:border-[#dcc4aa]"
              />
            </label>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-[#333333]">Ödeme yöntemi</legend>
            <div className="grid gap-3 min-[520px]:grid-cols-3">
              {[
                { value: "whatsapp", label: "WhatsApp", description: "Sohbette onaylayın." },
                { value: "card", label: "Kart", description: "Iyzico test karti." },
                { value: "cash", label: "Nakit", description: "Manuel olarak ödeyin." },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    paymentMethod === option.value
                      ? "border-[#111111] bg-[#111111] text-white"
                      : "border-black/8 bg-white text-[#555555] hover:border-[#dcc4aa]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={option.value}
                    checked={paymentMethod === option.value}
                    onChange={() => setPaymentMethod(option.value as "whatsapp" | "card" | "cash")}
                    className="sr-only"
                  />
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className={`mt-2 text-xs leading-5 ${paymentMethod === option.value ? "text-white/72" : "text-[#888888]"}`}>
                    {option.description}
                  </p>
                </label>
              ))}
            </div>
          </fieldset>

          {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          {paymentNotice ? <p className="rounded-xl bg-[#EADBC8]/50 px-4 py-3 text-sm text-[#111111]">{paymentNotice}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#111111] px-5 py-3.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[#bcbcbc]"
          >
            {isSubmitting ? "Sipariş gönderiliyor..." : "Siparişi tamamla"}
          </button>
        </div>
      </form>

      <aside className="dark-panel rounded-[1.35rem] border border-black/10 p-5 text-white shadow-[0_30px_70px_-36px_rgba(17,17,17,0.34)] sm:rounded-[1.6rem] sm:p-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/50">Sipariş Kontrolü</p>
        <h3 className="editorial-title mt-4 text-3xl text-white sm:text-4xl">Son düzen.</h3>
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
              <div>
                <p className="font-medium text-white">{item.name}</p>
                <p className="mt-1 text-white/56">Adet {item.quantity}</p>
              </div>
              <span className="font-medium text-white/88">{formatCurrency(Number(item.price) * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between text-sm text-white/56">
          <span>Ödeme</span>
          <span className="capitalize text-white/88">{paymentMethod}</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-sm text-white/56">Toplam</span>
          <span className="text-xl font-semibold">{formatCurrency(total)}</span>
        </div>
      </aside>
    </section>
  );
}
