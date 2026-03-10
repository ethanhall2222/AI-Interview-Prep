import { getOptionalServerSession } from "@/lib/auth-helpers";

import JobsClient from "./jobs-client";

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: Promise<{ jobTitle?: string; company?: string; jobUrl?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const { session } = await getOptionalServerSession();

  return (
    <JobsClient
      canPersist={Boolean(session)}
      initialParams={{
        jobTitle: resolvedSearchParams?.jobTitle ?? "",
        company: resolvedSearchParams?.company ?? "",
        jobUrl: resolvedSearchParams?.jobUrl ?? "",
      }}
    />
  );
}
