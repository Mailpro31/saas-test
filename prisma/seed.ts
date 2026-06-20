import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

const DEMO_EMAIL = "demo@paidpilot.app";
const DEMO_PASSWORD = "demo12345";

async function main() {
  // Reset the demo account so the seed is idempotent.
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      name: "Maya Rivera",
      handle: "maya-rivera",
      currency: "USD",
      businessName: "Maya Rivera Media",
      lateFeePercent: 5,
      paymentDetails:
        "Bank transfer: Maya Rivera Media\nIBAN: GB00 0000 0000 0000\nOr PayPal: maya@example.com",
      tagline: "Tech & productivity for everyday humans",
      bio: "I make honest, friendly videos about the tools that help people work and live better. 6 years creating, 200M+ lifetime views, and a community that actually buys what I recommend.",
      brandColor: "#6d28d9",
      mediaKitPublic: true,
      platforms: JSON.stringify([
        { platform: "YouTube", handle: "@mayarivera", followers: 320000 },
        { platform: "Instagram", handle: "@maya.rivera", followers: 148000 },
        { platform: "TikTok", handle: "@mayarivera", followers: 512000 },
        { platform: "Newsletter", handle: "The Toolbox", followers: 24000 },
      ]),
      audienceTotal: 320000 + 148000 + 512000 + 24000,
      packages: {
        create: [
          {
            name: "Dedicated YouTube video",
            description: "60–90s integration in a main video",
            price: 450000,
            currency: "USD",
            sortOrder: 0,
          },
          {
            name: "Instagram Reel + Story set",
            description: "1 Reel + 3 Stories with link",
            price: 180000,
            currency: "USD",
            sortOrder: 1,
          },
          {
            name: "TikTok video",
            description: "Native 30–45s TikTok",
            price: 150000,
            currency: "USD",
            sortOrder: 2,
          },
          {
            name: "Newsletter feature",
            description: "Primary sponsor slot",
            price: 90000,
            currency: "USD",
            sortOrder: 3,
          },
        ],
      },
    },
  });

  // Helper to create a deal owned by the demo user.
  const mkDeal = (data: Omit<Prisma.DealUncheckedCreateInput, "userId">) =>
    prisma.deal.create({ data: { userId: user.id, currency: "USD", ...data } });

  // --- Paid deal ---
  const notion = await mkDeal({
    brandName: "Notion",
    contactName: "Priya Shah",
    contactEmail: "priya@notion.so",
    platform: "YouTube",
    stage: "Paid",
    amount: 450000,
    paymentTermsDays: 30,
    paidAt: daysFromNow(-5),
    notes: "Integration in the 'productivity reset' video. Went great.",
  });
  await prisma.invoice.create({
    data: {
      userId: user.id,
      dealId: notion.id,
      number: "INV-0001",
      status: "Paid",
      issueDate: daysFromNow(-40),
      dueDate: daysFromNow(-10),
      paidAt: daysFromNow(-5),
      amount: 450000,
      currency: "USD",
      notes: user.paymentDetails,
      lineItems: JSON.stringify([
        { description: "YouTube integration — Notion", amount: 450000 },
      ]),
    },
  });

  // --- Overdue deal (the hero pain point) ---
  const linear = await mkDeal({
    brandName: "Linear",
    contactName: "Tom Becker",
    contactEmail: "tom@linear.app",
    platform: "Newsletter",
    stage: "Invoiced",
    amount: 90000,
    paymentTermsDays: 30,
    notes: "Newsletter primary slot. Sent invoice 6 weeks ago — chasing.",
  });
  const linearInvoice = await prisma.invoice.create({
    data: {
      userId: user.id,
      dealId: linear.id,
      number: "INV-0002",
      status: "Sent",
      issueDate: daysFromNow(-44),
      dueDate: daysFromNow(-14),
      amount: 90000,
      currency: "USD",
      notes: user.paymentDetails,
      lineItems: JSON.stringify([
        { description: "Newsletter feature — Linear", amount: 90000 },
      ]),
    },
  });
  await prisma.reminder.createMany({
    data: [
      {
        invoiceId: linearInvoice.id,
        level: 1,
        subject: "Invoice INV-0002 — just a quick heads up",
        body: "Hi Tom,\n\nFriendly heads up that invoice INV-0002 for $900.00 is due. No action needed if it's on its way!\n\nBest,\nMaya",
        status: "Sent",
        scheduledFor: daysFromNow(-14),
        sentAt: daysFromNow(-13),
      },
      {
        invoiceId: linearInvoice.id,
        level: 2,
        subject: "Reminder: invoice INV-0002 ($900.00) is now due",
        body: "Hi Tom,\n\nFollowing up on invoice INV-0002 for $900.00, due 14 days ago. Could you share the expected payment date?\n\nBest,\nMaya",
        status: "Sent",
        scheduledFor: daysFromNow(-7),
        sentAt: daysFromNow(-6),
      },
    ],
  });

  // --- Invoiced, not yet due ---
  const figma = await mkDeal({
    brandName: "Figma",
    contactName: "Dana Lee",
    contactEmail: "dana@figma.com",
    platform: "Instagram",
    stage: "Invoiced",
    amount: 180000,
    paymentTermsDays: 30,
  });
  await prisma.invoice.create({
    data: {
      userId: user.id,
      dealId: figma.id,
      number: "INV-0003",
      status: "Sent",
      issueDate: daysFromNow(-3),
      dueDate: daysFromNow(27),
      amount: 180000,
      currency: "USD",
      notes: user.paymentDetails,
      lineItems: JSON.stringify([
        { description: "Instagram Reel + Stories — Figma", amount: 180000 },
      ]),
    },
  });

  // --- In progress with deliverables ---
  const vercel = await mkDeal({
    brandName: "Vercel",
    contactName: "Sam Ortiz",
    contactEmail: "sam@vercel.com",
    platform: "YouTube",
    stage: "InProgress",
    amount: 450000,
    paymentTermsDays: 45,
    startDate: daysFromNow(-2),
  });
  await prisma.deliverable.createMany({
    data: [
      { dealId: vercel.id, title: "Send script for approval", dueDate: daysFromNow(2), done: true },
      { dealId: vercel.id, title: "Film + edit integration", dueDate: daysFromNow(6), done: false },
      { dealId: vercel.id, title: "Publish video", dueDate: daysFromNow(9), done: false },
    ],
  });

  // --- Earlier-stage deals ---
  await mkDeal({
    brandName: "Squarespace",
    contactName: "Jules Verne",
    contactEmail: "jules@squarespace.com",
    platform: "TikTok",
    stage: "Confirmed",
    amount: 150000,
    paymentTermsDays: 30,
    startDate: daysFromNow(7),
  });
  await mkDeal({
    brandName: "Glossier",
    contactName: "Bea Wong",
    contactEmail: "bea@glossier.com",
    platform: "Instagram",
    stage: "Negotiating",
    amount: 220000,
    notes: "They offered $1,800 for 2 Reels — countered at $2,200.",
  });
  await mkDeal({
    brandName: "Audible",
    platform: "Newsletter",
    stage: "Pitch",
    amount: 90000,
    notes: "Cold pitch sent via their partnerships form.",
  });
  await mkDeal({
    brandName: "QuickClip AI",
    platform: "YouTube",
    stage: "Lost",
    amount: 300000,
    notes: "Budget pulled for the quarter.",
  });

  console.log("✅ Seeded demo account:");
  console.log(`   Email:    ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log(`   Media kit: /m/${user.handle}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
