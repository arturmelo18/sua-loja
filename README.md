# Nuxt Minimal Starter

## Super administrador

Defina estas variáveis no ambiente do servidor para criar ou promover automaticamente o usuário super administrador na inicialização do Nitro:

```env
SUPER_ADMIN_EMAIL=admin@exemplo.com
SUPER_ADMIN_PASSWORD=uma-senha-forte
SUPER_ADMIN_NAME=Super administrador
```

O super administrador acessa a aba **Lojas** em `/adminPage`. A desativação de uma loja é lógica: o registro permanece no banco com `active: false`.

## Recuperação de senha

Configure o Resend no ambiente do servidor para enviar os códigos de recuperação:

```env
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=Sua Loja <noreply@seudominio.com>
```

O fluxo está disponível em `/forgotPassword`. O código expira em 15 minutos, aceita no máximo cinco tentativas e é armazenado apenas como hash.

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
