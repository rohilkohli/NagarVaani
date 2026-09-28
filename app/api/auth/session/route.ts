import { jsonResponse, getErrorMessage } from '@/lib/api';
import { authenticateFirebaseUser, createAdminSessionToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const authorization = String(req.headers.get('authorization') || '');
    const idToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    const user = await authenticateFirebaseUser(idToken);
    const token = createAdminSessionToken({
      sub: user.uid,
      role: user.role,
      email: user.email,
    });

    return jsonResponse({
      success: true,
      token,
      role: user.role,
      expiresIn: 60 * 60,
    });
  } catch (error) {
    return jsonResponse({ success: false, error: getErrorMessage(error) }, 401);
  }
}
