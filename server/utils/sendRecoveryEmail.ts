export async function sendRecoveryEmail(email: string, code: string) {
  const config = useRuntimeConfig()

  if (!config.resendApiKey || !config.resendFromEmail) {
    throw createError({
      statusCode: 500,
      statusMessage: 'O envio de e-mail ainda não está configurado no servidor.',
    })
  }

  const response = await $fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      from: config.resendFromEmail,
      to: [email],
      subject: 'Código para recuperar sua conta',
      html: `
        <div style="font-family: Arial, sans-serif; color: #241f1d; max-width: 560px; margin: auto;">
          <h1 style="color: #7A1F2E;">Recuperação de conta</h1>
          <p>Use o código abaixo para criar uma nova senha:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #7A1F2E;">${code}</p>
          <p>Este código expira em 15 minutos e só pode ser usado uma vez.</p>
          <p>Se você não solicitou esta recuperação, ignore este e-mail.</p>
        </div>
      `,
    },
  })

  return response
}
