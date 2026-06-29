import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteShell } from "@/components/layout/site-shell";
import { ProductDetail } from "@/components/products/product-detail";
import { getProduct } from "@/lib/api";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await getProduct(slug);

    return {
      title: `${product.name} | Micro Commerce`,
      description: product.description || `${product.name} ürününü inceleyin ve doğrudan sipariş verin.`,
      openGraph: {
        title: product.name,
        description: product.description || `${product.name} ürününü Micro Commerce üzerinden sipariş verin.`,
        images: product.image ? [{ url: product.image, alt: product.name }] : [],
      },
    };
  } catch {
    return {
      title: "Ürün | Micro Commerce",
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let product: Awaited<ReturnType<typeof getProduct>> | null = null;

  try {
    product = await getProduct(slug);
  } catch {
    notFound();
  }

  return (
    <SiteShell
      eyebrow="Ürün Detayı"
      title={product?.name}
      description={product?.description || "Doğrudan sepete ekleme aksiyonları ve sade satın alma hiyerarşisi sunan premium ürün sayfası."}
      heroTone="compact"
    >
      {product ? <ProductDetail product={product} /> : null}
    </SiteShell>
  );
}
