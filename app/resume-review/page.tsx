import { requireServerSession } from "@/lib/auth-helpers";
import ResumeReviewClient from "./resume-review-client";

export default async function ResumeReviewPage() {
  await requireServerSession();
  return <ResumeReviewClient />;
}
