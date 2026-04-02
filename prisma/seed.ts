import "dotenv/config";
import { PlatformCode, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
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
      name: "科技蓝卡片风",
      targetPlatform: PlatformCode.WECHAT_OFFICIAL,
      version: 2,
      tokens: {
        primaryColor: "#1d4ed8",
        accentColor: "#0f3d91",
        headingColor: "#0f172a",
        textColor: "#1f2937",
        backgroundColor: "#ffffff",
        surfaceColor: "#f7fbff",
        softBackground: "#e8f1ff",
        borderColor: "#d9e7ff",
        mutedColor: "#5b6472",
        codeBackground: "#0f172a",
      },
      template: { layout: "hero-card" },
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
        mutedColor: "#6b7280",
        codeBackground: "#f8f8f8",
      },
      template: { layout: "minimal" },
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
        mutedColor: "#94a3b8",
        codeBackground: "#111827",
      },
      template: { layout: "column-dark" },
      isActive: true,
    },
    {
      code: "wechat-superpowers-green",
      name: "森绿长文风",
      targetPlatform: PlatformCode.WECHAT_OFFICIAL,
      version: 1,
      tokens: {
        primaryColor: "#07c160",
        accentColor: "#06ad56",
        headingColor: "#11703f",
        textColor: "#111111",
        backgroundColor: "#ffffff",
        surfaceColor: "#f8fff9",
        softBackground: "#e8f7f0",
        borderColor: "#cfeedd",
        mutedColor: "#5f6b63",
        codeBackground: "#0b1020",
      },
      template: { layout: "superpowers-green" },
      isActive: true,
    },
  ];

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { code: theme.code },
      update: {
        name: theme.name,
        version: theme.version,
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
      credentialCiphertext: Buffer.from(JSON.stringify({ appId: "replace_me", appSecret: "replace_me" })).toString("base64"),
      meta: { author: "Local Author" },
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

