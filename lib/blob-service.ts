import { prisma } from '@/lib/prisma';
import type { SearchScope, StatsPeriod, TagMode } from '@/lib/dashboard-types';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  parseDateParam,
  slugifyTag,
  startOfDay,
  startOfMonth,
  startOfWeek
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

type DashboardOptions = {
  date?: string | null;
  query?: string | null;
  tag?: string | null;
  scope?: SearchScope;
  mode?: TagMode;
  period?: StatsPeriod;
};

export async function getDashboardData(userId: string, options: DashboardOptions) {
  if (!prisma) {
    return null;
  }

  const activeDate = parseDateParam(options.date);
  const monthStart = startOfMonth(activeDate);
  const monthEnd = endOfMonth(activeDate);
  const weekStart = startOfWeek(activeDate);
  const weekEnd = endOfWeek(activeDate);
  const dayStart = startOfDay(activeDate);
  const dayEnd = endOfDay(activeDate);
  const search = options.query?.trim() ?? '';
  const activeTag = options.tag ? slugifyTag(options.tag) : null;
  const scope: SearchScope = options.scope ?? 'all';
  const tagMode: TagMode = options.mode ?? 'recent';
  const statsPeriod: StatsPeriod = options.period ?? 'week';

  const searchWhere =
    search.length === 0
      ? { userId }
      : {
          userId,
          ...(scope === 'tags'
            ? {
                tags: {
                  some: {
                    tag: {
                      name: { contains: search, mode: 'insensitive' as const }
                    }
                  }
                }
              }
            : scope === 'blobs'
              ? {
                  OR: [
                    { title: { contains: search, mode: 'insensitive' as const } },
                    { summary: { contains: search, mode: 'insensitive' as const } },
                    { keyLearnings: { contains: search, mode: 'insensitive' as const } }
                  ]
                }
              : {
                  OR: [
                    { title: { contains: search, mode: 'insensitive' as const } },
                    { summary: { contains: search, mode: 'insensitive' as const } },
                    { keyLearnings: { contains: search, mode: 'insensitive' as const } },
                    {
                      tags: {
                        some: {
                          tag: {
                            name: { contains: search, mode: 'insensitive' as const }
                          }
                        }
                      }
                    }
                  ]
                })
        };

  const [monthBlobs, weekBlobs, dayBlobs, searchBlobs, allBlobDates, tagRows, activeTagBlobRows, recentBlobs] =
    await Promise.all([
      prisma.blobEntry.findMany({
        where: {
          userId,
          consumedAt: {
            gte: monthStart,
            lt: monthEnd
          }
        },
        include: includeTags,
        orderBy: [{ consumedAt: 'desc' }, { createdAt: 'desc' }]
      }),
      prisma.blobEntry.findMany({
        where: {
          userId,
          consumedAt: {
            gte: weekStart,
            lt: weekEnd
          }
        },
        include: includeTags
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
        where: searchWhere,
        include: includeTags,
        orderBy: search.length === 0 ? [{ consumedAt: 'desc' }, { createdAt: 'desc' }] : [{ consumedAt: 'desc' }, { createdAt: 'desc' }],
        take: 50
      }),
      prisma.blobEntry.findMany({
        where: { userId },
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
      }),
      activeTag
        ? prisma.blobEntry.findMany({
            where: {
              userId,
              tags: {
                some: {
                  tag: {
                    name: activeTag
                  }
                }
              }
            },
            include: includeTags,
            orderBy: [{ consumedAt: 'desc' }, { createdAt: 'desc' }]
          })
        : Promise.resolve([]),
      prisma.blobEntry.findMany({
        where: { userId },
        include: includeTags,
        orderBy: [{ consumedAt: 'desc' }, { createdAt: 'desc' }],
        take: 6
      })
    ]);

  const countsByDate = new Map<string, number>();
  for (const blob of monthBlobs) {
    const key = blob.consumedAt.toISOString().slice(0, 10);
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
  }

  const allDateKeys = allBlobDates.map((blob: { consumedAt: Date }) => blob.consumedAt.toISOString().slice(0, 10));
  const totalMinutesMonth = monthBlobs.reduce((sum: number, blob: { durationMin: number | null }) => sum + (blob.durationMin ?? 0), 0);
  const totalMinutesWeek = weekBlobs.reduce((sum: number, blob: { durationMin: number | null }) => sum + (blob.durationMin ?? 0), 0);
  const tagCounts = tagRows.map((tag: { name: string; _count: { blobs: number } }) => ({ name: tag.name, count: tag._count.blobs }));
  const allDates = new Set<string>(allDateKeys);

  const dayTypeCounts = blobTypes
    .map((type) => ({
      type,
      count: dayBlobs.filter((blob: { type: string }) => blob.type === type).length
    }))
    .filter((entry) => entry.count > 0);

  const topicDistribution = buildTopicDistribution(statsPeriod === 'week' ? weekBlobs : monthBlobs);

  const activeTagBlobs =
    tagMode === 'popular'
      ? [...activeTagBlobRows].sort((left, right) => getBlobWeight(right) - getBlobWeight(left))
      : activeTagBlobRows;

  return {
    activeDate,
    searchScope: scope,
    tagMode,
    statsPeriod,
    monthBlobs,
    weekBlobs,
    dayBlobs,
    searchBlobs,
    recentBlobs,
    activeTagBlobs,
    tagCounts,
    countsByDate,
    dayTypeCounts,
    stats: {
      monthBlobCount: monthBlobs.length,
      monthMinutes: totalMinutesMonth,
      weekBlobCount: weekBlobs.length,
      weekMinutes: totalMinutesWeek,
      totalBlobCount: allBlobDates.length,
      activeTagCount: tagRows.length,
      activeDays: allDates.size,
      streak: getCurrentStreak(Array.from(allDates))
    },
    topicDistribution
  };
}

export async function createBlobEntry(
  userId: string,
  values: {
    title: string;
    type: string;
    sourceUrl?: string;
    summary?: string;
    keyLearnings?: string;
    durationMin?: number | null;
    consumedAt: string;
    tags: string[];
  }
) {
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

export async function updateBlobEntry(
  userId: string,
  blobId: string,
  values: {
    title: string;
    type: string;
    sourceUrl?: string;
    summary?: string;
    keyLearnings?: string;
    durationMin?: number | null;
    consumedAt: string;
    tags: string[];
  }
) {
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

export async function exportBlobData(userId: string) {
  if (!prisma) {
    return null;
  }

  const [user, blobs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    }),
    prisma.blobEntry.findMany({
      where: { userId },
      include: includeTags,
      orderBy: [{ consumedAt: 'desc' }, { createdAt: 'desc' }]
    })
  ]);

  return {
    exportedAt: new Date().toISOString(),
    user,
    blobs: blobs.map((blob: {
      id: string;
      title: string;
      type: string;
      sourceUrl: string | null;
      summary: string | null;
      keyLearnings: string | null;
      durationMin: number | null;
      consumedAt: Date;
      createdAt: Date;
      updatedAt: Date;
      tags: Array<{ tag: { name: string } }>;
    }) => ({
      id: blob.id,
      title: blob.title,
      type: blob.type,
      sourceUrl: blob.sourceUrl,
      summary: blob.summary,
      keyLearnings: blob.keyLearnings,
      durationMin: blob.durationMin,
      consumedAt: blob.consumedAt.toISOString(),
      createdAt: blob.createdAt.toISOString(),
      updatedAt: blob.updatedAt.toISOString(),
      tags: blob.tags.map(({ tag }: { tag: { name: string } }) => tag.name)
    }))
  };
}

function normalizeBlobType(value: string): BlobTypeValue {
  const normalized = value.trim().toUpperCase();
  return blobTypes.includes(normalized as BlobTypeValue) ? (normalized as BlobTypeValue) : 'OTHER';
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

  let yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  while (normalized.has(yesterday.toISOString().slice(0, 10))) {
    streak += 1;
    yesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() - 1);
  }

  return streak;
}

function buildTopicDistribution(blobs: Array<{ tags: Array<{ tag: { name: string } }> }>) {
  const counts = new Map<string, number>();

  for (const blob of blobs) {
    for (const tagRef of blob.tags) {
      counts.set(tagRef.tag.name, (counts.get(tagRef.tag.name) ?? 0) + 1);
    }
  }

  const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);

  return Array.from(counts.entries())
    .map(([name, count], index) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color: chartColors[index % chartColors.length]
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
}

function getBlobWeight(blob: { summary: string | null; keyLearnings: string | null; tags: Array<unknown>; consumedAt: Date }) {
  return (
    (blob.summary?.length ?? 0) +
    (blob.keyLearnings?.length ?? 0) +
    blob.tags.length * 20 +
    blob.consumedAt.getTime() / 1_000_000_000_000
  );
}

const chartColors = ['#39c5bb', '#7dd3fc', '#818cf8', '#f472b6', '#fbbf24'];
