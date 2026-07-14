import { redirect } from "next/navigation";
import { getUser } from "@/lib/data";

export default async function HomePage() {
  const user = await getUser();
  redirect(user ? "/dashboard" : "/login");
}
