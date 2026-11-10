import { Transaction } from '../../../../database/prisma.service';

export async function workdayStatistics(tx: Transaction, ids: string[]) {
  const counts = new Map(ids.map((id) => [id, { completed_visits: 0, total_visits: 0 }]));
  if (!ids.length) return counts;
  const groups = await tx.visit.groupBy({
    by: ['workdayId', 'status'],
    where: { workdayId: { in: ids }, status: { not: 'cancelled' } },
    _count: { _all: true },
  });
  for (const group of groups) {
    const stats = counts.get(group.workdayId!);
    if (!stats) continue;
    stats.total_visits += group._count._all;
    if (group.status === 'completed') stats.completed_visits += group._count._all;
  }
  return counts;
}
