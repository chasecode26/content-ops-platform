require("dotenv/config");

const { PlatformCode, PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { id: "user_local_default" },
    update: {},
    create: {
      id: "user_local_default",
      name: "Local User",
      email: "local@example.com",
    },
  });

  const themes = [
    {
      code: "wechat-tech-green",
      name: "科技简约风",
      targetPlatform: PlatformCode.WECHAT_OFFICIAL,
      version: 1,
      tokens: {
        primaryColor: "#07c160",
        headingColor: "#0f172a",
        textColor: "#2b2b2b",
        backgroundColor: "#ffffff",
        borderColor: "#d9f7e8",
      },
      template: {
        layout: "card",
      },
      isActive: true,
    },
    {
      code: "wechat-minimal-light",
      name: "极简白底",
      targetPlatform: PlatformCode.WECHAT_OFFICIAL,
      version: 1,
      tokens: {
        primaryColor: "#111111",
        headingColor: "#111111",
        textColor: "#303133",
        backgroundColor: "#ffffff",
        borderColor: "#ececec",
      },
      template: {
        layout: "minimal",
      },
      isActive: true,
    },
    {
      code: "wechat-dark-column",
      name: "深色专栏",
      targetPlatform: PlatformCode.WECHAT_OFFICIAL,
      version: 1,
      tokens: {
        primaryColor: "#7dd3fc",
        headingColor: "#f8fafc",
        textColor: "#dbe4ee",
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
      },
      template: {
        layout: "column-dark",
      },
      isActive: true,
    },
  ];

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { code: theme.code },
      update: {
        name: theme.name,
        tokens: theme.tokens,
        template: theme.template,
        isActive: theme.isActive,
      },
      create: theme,
    });
  }

  await prisma.channelAccount.upsert({
    where: { id: "account_local_wechat" },
    update: {},
    create: {
      id: "account_local_wechat",
      userId: user.id,
      platform: PlatformCode.WECHAT_OFFICIAL,
      name: "Local WeChat Account",
      credentialCiphertext: Buffer.from(
        JSON.stringify({
          appId: "replace_me",
          appSecret: "replace_me",
        }),
      ).toString("base64"),
      meta: {
        author: "Local Author",
      },
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
