import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeedbackExperience } from "@/components/feedback/feedback-experience";
import { getBusinessBySlug } from "@/lib/feedback/business";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  const name = business?.name ?? "Raade's Tea House";
  return {
    title: "Share your visit",
    description: `Tell ${name} how your visit went — it takes less than a minute.`,
    robots: { index: false, follow: false },
    openGraph: {
      title: `Share your visit · ${name}`,
      description: `Tell ${name} how your visit went.`,
    },
  };
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  return (
    <FeedbackExperience
      businessSlug={business.slug}
      businessName={business.name}
      positiveRatingMin={business.positiveRatingMin}
    />
  );
}
