import { requireServerSession } from "@/lib/auth-helpers";

import JobsClient from "./jobs-client";

export default async function JobsPage() {
  await requireServerSession();
  return <JobsClient />;
}
