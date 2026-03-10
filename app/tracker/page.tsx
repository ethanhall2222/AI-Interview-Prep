import { requireServerSession } from "@/lib/auth-helpers";
import TrackerClient from "./tracker-client";

export default async function TrackerPage() {
  await requireServerSession();
  return <TrackerClient />;
}
