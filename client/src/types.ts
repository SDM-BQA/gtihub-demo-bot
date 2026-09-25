// Shapes returned by the API.

export type Repo = { id: number; fullName: string };

export type Me = {
  user: { login: string; avatarUrl: string | null };
  repos: Repo[];
};
