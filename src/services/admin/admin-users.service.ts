type UpdateUserPayload = {
  roleId?: string;
  isActive?: boolean;
};

export async function updateAdminUser(
  userId: string,
  payload: UpdateUserPayload,
): Promise<void> {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "No se pudo actualizar el usuario.";
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore JSON parse errors and keep the default message
    }
    throw new Error(message);
  }
}
