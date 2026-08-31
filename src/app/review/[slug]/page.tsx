import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeedbackExperience } from "@/components/feedback/feedback-experience";
import { getBusinessBySlug } from "@/lib/feedback/business";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Share your visit",
  robots: { index: false, follow: false },
};

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
