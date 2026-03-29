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

  await prisma.theme.upsert({
    where: { code: "wechat-tech-green" },
    update: {},
    create: {
      code: "wechat-tech-green",
      name: "WeChat Tech Green",
      targetPlatform: PlatformCode.WECHAT_OFFICIAL,
      version: 1,
      tokens: {
        primaryColor: "#07c160",
        headingColor: "#111111",
      },
      template: {
        layout: "card",
      },
      isActive: true,
    },
  });

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
    // Keep seed output clean for local bootstrap troubleshooting.
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
