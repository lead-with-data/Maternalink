import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('maternalink_session', { path: '/' });
  return redirect('/login');
};
