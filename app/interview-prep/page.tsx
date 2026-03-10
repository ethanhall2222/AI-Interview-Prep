import { requireServerSession } from "@/lib/auth-helpers";
import InterviewPrepClient from "./prep-client";

export default async function InterviewPrepPage() {
  await requireServerSession();
  return <InterviewPrepClient />;
}
