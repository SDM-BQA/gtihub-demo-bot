import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';

// The signed-in user and the repos they can manage. Only safe, display-level fields are selected.
export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { login: true, avatarUrl: true },
  });
  if (!user) throw new HttpError(401, 'Not signed in');

  const repos = await prisma.repo.findMany({
    where: { active: true, installation: { userId } },
    select: { id: true, fullName: true },
    orderBy: { fullName: 'asc' },
  });

  return { user, repos };
}
