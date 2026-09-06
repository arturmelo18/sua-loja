import { UserSchema } from "~/server/models/user";

export default defineEventHandler(async (event) => {
  const emailParam = getRouterParam(event, "email");
  const body = await readBody(event);

  const { name, email, kind } = body;

  const fieldsToUpdate = Object.fromEntries(
    Object.entries({
      name,
      email,
      kind: kind?.includes("admin") ? "admin" : "user",
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
