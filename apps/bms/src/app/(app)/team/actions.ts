"use server";

import { revalidatePath } from "next/cache";
import { api } from "../../../lib/api";

type Result = { ok: boolean; error?: string };

const done = (): Result => {
  revalidatePath("/team");
  revalidatePath("/profile");
  return { ok: true };
};

const failed = (e: unknown): Result => ({
  ok: false,
  error: e instanceof Error ? e.message : String(e),
});

/**
 * All three writes are gated by `team.manage` in the database
 * (0010_team_admin.sql). The API turns the refusal into a 403; we surface the
 * reason rather than pretending the action succeeded.
 */
export async function recordLicence(input: {
  staffId: string;
  licenceClass: string;
  licenceNumber?: string;
  regulator?: string;
  expiresOn?: string;
}): Promise<Result> {
  try {
    await api("/team/licences", { method: "POST", body: JSON.stringify(input) });
    return done();
  } catch (e) {
    return failed(e);
  }
}

export async function grantRole(input: {
  staffId: string;
  roleCode: string;
  licenceId?: string;
}): Promise<Result> {
  try {
    await api("/team/grants", { method: "POST", body: JSON.stringify(input) });
    return done();
  } catch (e) {
    return failed(e);
  }
}

export async function revokeGrant(grantId: string): Promise<Result> {
  try {
    await api(`/team/grants/${grantId}`, { method: "DELETE" });
    return done();
  } catch (e) {
    return failed(e);
  }
}
