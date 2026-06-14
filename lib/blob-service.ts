import { prisma } from '@/lib/prisma';
import {
  endOfDay,
  endOfMonth,
  parseDateParam,
  slugifyTag,
  startOfDay,
  startOfMonth
} from '@/lib/utils';

const includeTags = {
  tags: {
    include: {
      tag: true
    }
  }
};

const blobTypes = ['VIDEO', 'BOOK', 'PAPER', 'ARTICLE', 'PODCAST', 'CONFERENCE', 'COURSE', 'OTHER'] as const;
type BlobTypeValue = (typeof blobTypes)[number];

export async function getDashboardData(userId: string, options: { date?: string | null; query?: string | null; tag?: string | null }) {
  if (!prisma) {
    return null;
  }

  const activeDate = parseDateParam(options.date);
  const monthStart = startOfMonth(activeDate);
  const monthEnd = endOfMonth(activeDate);
  const dayStart = startOfDay(activeDate);
  const dayEnd = endOfDay(activeDate);
  const search = options.query?.trim();
  const activeTag = options.tag ? slugifyTag(options.tag) : null;

  const [monthBlobs, dayBlobs, allBlobs, allBlobDates, tagRows] = await Promise.all([
    prisma.blobEntry.findMany({
      where: {
        userId,
        consumedAt: {
          gte: monthStart,
          lt: monthEnd
        }
      },
      include: includeTags,
      orderBy: {
        consumedAt: 'desc'
      }
    }),
    prisma.blobEntry.findMany({
      where: {
        userId,
        consumedAt: {
          gte: dayStart,
          lt: dayEnd
        }
      },
      include: includeTags,
      orderBy: [{ consumedAt: 'desc' }, { createdAt: 'desc' }]
    }),
    prisma.blobEntry.findMany({
      where: {
        userId,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { summary: { contains: search, mode: 'insensitive' } },
                { keyLearnings: { contains: search, mode: 'insensitive' } },
                {
                  tags: {
                    some: {
                      tag: {
                        name: { contains: search, mode: 'insensitive' }
                      }
                    }
                  }
                }
              ]
            }
          : {}),
        ...(activeTag
          ? {
              tags: {
                some: {
                  tag: { name: activeTag }
                }
              }
            }
          : {})
      },
      include: includeTags,
      orderBy: [{ consumedAt: 'desc' }, { createdAt: 'desc' }],
      take: 50
    }),
    prisma.blobEntry.findMany({
      where: {
        userId
      },
      select: {
        consumedAt: true
      },
      orderBy: {
        consumedAt: 'desc'
      }
    }),
    prisma.tag.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            blobs: true
          }
        }
      },
      orderBy: [{ blobs: { _count: 'desc' } }, { name: 'asc' }]
    })
  ]);

  const countsByDate = new Map<string, number>();
  for (const blob of monthBlobs) {
    const key = blob.consumedAt.toISOString().slice(0, 10);
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
  }

  const totalMinutes = monthBlobs.reduce((sum: number, blob: { durationMin: number | null }) => sum + (blob.durationMin ?? 0), 0);
  const tagCounts = tagRows.map((tag: { name: string; _count: { blobs: number } }) => ({ name: tag.name, count: tag._count.blobs }));

  const allDates = new Set<string>(allBlobDates.map((blob: { consumedAt: Date }) => blob.consumedAt.toISOString().slice(0, 10)));
  const streak = getCurrentStreak(Array.from(allDates));

  return {
    activeDate,
    monthBlobs,
    dayBlobs,
    allBlobs,
    tagCounts,
    countsByDate,
    stats: {
      monthBlobCount: monthBlobs.length,
      monthMinutes: totalMinutes,
      totalBlobCount: allBlobDates.length,
      activeTagCount: tagRows.length,
      activeDays: allDates.size,
      streak
    }
  };
}

export async function createBlobEntry(userId: string, values: {
  title: string;
  type: string;
  sourceUrl?: string;
  summary?: string;
  keyLearnings?: string;
  durationMin?: number | null;
  consumedAt: string;
  tags: string[];
}) {
  if (!prisma) {
    return;
  }

  const normalizedTags = Array.from(new Set(values.tags.map(slugifyTag).filter(Boolean)));
  const consumedAt = parseDateParam(values.consumedAt);

  await prisma.$transaction(async (tx: any) => {
    const created = await tx.blobEntry.create({
      data: {
        userId,
        title: values.title.trim(),
        type: normalizeBlobType(values.type),
        sourceUrl: values.sourceUrl?.trim() || null,
        summary: values.summary?.trim() || null,
        keyLearnings: values.keyLearnings?.trim() || null,
        durationMin: values.durationMin ?? null,
        consumedAt
      }
    });

    for (const tagName of normalizedTags) {
      const tag = await tx.tag.upsert({
        where: {
          userId_name: {
            userId,
            name: tagName
          }
        },
        update: {},
        create: {
          userId,
          name: tagName
        }
      });

      await tx.blobTag.create({
        data: {
          blobId: created.id,
          tagId: tag.id
        }
      });
    }
  });
}

export async function deleteBlobEntry(userId: string, blobId: string) {
  if (!prisma) {
    return;
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.blobEntry.deleteMany({
      where: {
        id: blobId,
        userId
      }
    });

    await tx.tag.deleteMany({
      where: {
        userId,
        blobs: {
          none: {}
        }
      }
    });
  });
}

export async function updateBlobEntry(userId: string, blobId: string, values: {
  title: string;
  type: string;
  sourceUrl?: string;
  summary?: string;
  keyLearnings?: string;
  durationMin?: number | null;
  consumedAt: string;
  tags: string[];
}) {
  if (!prisma) {
    return;
  }

  const normalizedTags = Array.from(new Set(values.tags.map(slugifyTag).filter(Boolean)));
  const consumedAt = parseDateParam(values.consumedAt);

  await prisma.$transaction(async (tx: any) => {
    await tx.blobEntry.updateMany({
      where: {
        id: blobId,
        userId
      },
      data: {
        title: values.title.trim(),
        type: normalizeBlobType(values.type),
        sourceUrl: values.sourceUrl?.trim() || null,
        summary: values.summary?.trim() || null,
        keyLearnings: values.keyLearnings?.trim() || null,
        durationMin: values.durationMin ?? null,
        consumedAt
      }
    });

    const blob = await tx.blobEntry.findFirst({
      where: {
        id: blobId,
        userId
      }
    });

    if (!blob) {
      return;
    }

    await tx.blobTag.deleteMany({
      where: {
        blobId: blob.id
      }
    });

    for (const tagName of normalizedTags) {
      const tag = await tx.tag.upsert({
        where: {
          userId_name: {
            userId,
            name: tagName
          }
        },
        update: {},
        create: {
          userId,
          name: tagName
        }
      });

      await tx.blobTag.create({
        data: {
          blobId: blob.id,
          tagId: tag.id
        }
      });
    }

    await tx.tag.deleteMany({
      where: {
        userId,
        blobs: {
          none: {}
        }
      }
    });
  });
}

function normalizeBlobType(value: string): BlobTypeValue {
  const normalized = value.trim().toUpperCase();

  if (blobTypes.includes(normalized as BlobTypeValue)) {
    return normalized as BlobTypeValue;
  }

  return 'OTHER';
}

function getCurrentStreak(dateKeys: string[]) {
  if (!dateKeys.length) {
    return 0;
  }

  const normalized = new Set(dateKeys);
  const today = startOfDay(new Date());
  let cursor = today;
  let streak = 0;

  while (normalized.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }

  if (streak > 0) {
    return streak;
  }

  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  while (normalized.has(yesterday.toISOString().slice(0, 10))) {
    streak += 1;
    yesterday.setDate(yesterday.getDate() - 1);
  }

  return streak;
}
