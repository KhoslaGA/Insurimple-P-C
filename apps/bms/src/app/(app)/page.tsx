import { redirect } from "next/navigation";

/** The app landing is the power-user Overview dashboard. */
export default function Home() {
  redirect("/dashboard");
}
