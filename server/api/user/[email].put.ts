import { UserSchema } from "~/server/models/user";

export default defineEventHandler(async (event) => {
  const emailParam = String(getRouterParam(event, "email") || "").trim().toLowerCase();
  const body = await readBody(event);

  const { name, kind } = body;
  const email = body.email ? String(body.email).trim().toLowerCase() : undefined;

  const fieldsToUpdate = Object.fromEntries(
    Object.entries({
      name,
      email,
      kind,
    }).filter(([_, value]) => value !== undefined),
  );

  try {
    const user = await UserSchema.findOneAndUpdate(
      { email: emailParam },
      { $set: fieldsToUpdate },
      { returnDocument: "after" },
    );

    if (!user) {
      throw createError({
        statusCode: 404,
        message: "Usuário não encontrado",
      });
    }

    const safeUser = user.toObject();
    delete safeUser.password;

    return {
      statusCode: 200,
      message: "Usuário atualizado com sucesso!",
      user: safeUser,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Erro ao atualizar usuário: " + error.message,
    });
  }
});
