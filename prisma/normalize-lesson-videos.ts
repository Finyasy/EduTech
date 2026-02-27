import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { normalizeYouTubeVideoId } from "../src/lib/youtube";

const databaseUrl =
  process.env.MIGRATE_DATABASE_URL ??
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "MIGRATE_DATABASE_URL, DIRECT_URL, or DATABASE_URL is required.",
  );
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const lessons = await prisma.lesson.findMany({
    select: {
      id: true,
      title: true,
      videoId: true,
    },
    orderBy: { id: "asc" },
  });

  let unchangedCount = 0;
  let updatedCount = 0;
  let invalidCount = 0;

  for (const lesson of lessons) {
    const normalized = normalizeYouTubeVideoId(lesson.videoId);
    if (!normalized) {
      invalidCount += 1;
      console.warn(
        `[invalid] ${lesson.id} (${lesson.title}) has non-normalizable videoId: ${lesson.videoId}`,
      );
      continue;
    }

    if (normalized === lesson.videoId) {
      unchangedCount += 1;
      continue;
    }

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { videoId: normalized },
    });
    updatedCount += 1;
    console.log(`[updated] ${lesson.id}: ${lesson.videoId} -> ${normalized}`);
  }

  console.log("");
  console.log("Lesson video normalization complete.");
  console.log(`Checked: ${lessons.length}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Unchanged: ${unchangedCount}`);
  console.log(`Invalid: ${invalidCount}`);
}

main()
  .catch((error) => {
    console.error("Normalization failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
