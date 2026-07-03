import "server-only";

import { eq } from "drizzle-orm";

import { mapEncryptedAdoConnectionRow } from "@/lib/db/adapters/drizzle/drizzle-shared";
import { getDb } from "@/lib/db/client";
import type { AdoConnectionRepository } from "@/lib/db/ports/ado-connection.repository.port";
import { adoConnections } from "@/lib/db/schema";

export const drizzleAdoConnectionRepository: AdoConnectionRepository = {
  async loadByUserId(userId) {
    const rows = await getDb()
      .select({
        authMethod: adoConnections.authMethod,
        organization: adoConnections.organization,
        project: adoConnections.project,
        team: adoConnections.team,
        encryptedSecrets: adoConnections.encryptedSecrets,
      })
      .from(adoConnections)
      .where(eq(adoConnections.userId, userId))
      .limit(1);

    const row = rows[0];
    return row ? mapEncryptedAdoConnectionRow(row) : null;
  },

  async updateContextDefaults(userId, defaults) {
    const project = defaults.project.trim();
    const team = defaults.team.trim();
    if (!project || !team) return false;

    const rows = await getDb()
      .update(adoConnections)
      .set({
        project,
        team,
        updatedAt: new Date(),
      })
      .where(eq(adoConnections.userId, userId))
      .returning({ id: adoConnections.id });

    return rows.length > 0;
  },
};
