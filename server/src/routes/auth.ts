import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import type { Bindings } from '../types/env.js'
import { Errors } from '../lib/errors.js'
import { createDbClient } from '../lib/db/client.js'
import { hashPassword, verifyPassword } from '../lib/password.js'

const auth = new Hono<{ Bindings: Bindings }>()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60 // 30일

auth.post('/redeem-invite', async (c) => {
  const body = await c.req.json<{ code?: string; email?: string; name?: string; password?: string }>().catch(() => ({}))

  const code = typeof body.code === 'string' ? body.code.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!code) throw Errors.badRequest('초대 코드를 입력해주세요')
  if (!email || !EMAIL_RE.test(email)) throw Errors.badRequest('유효한 이메일 주소를 입력해주세요')
  if (!password) throw Errors.badRequest('비밀번호를 입력해주세요')

  const db = createDbClient(c.env)

  const invite = await db.inviteCodes.findByCode(code)
  if (!invite) throw Errors.notFound('초대 코드')

  if (new Date(invite.expires_at) < new Date()) throw Errors.badRequest('만료된 초대 코드입니다')
  if (invite.used_at) throw Errors.badRequest('이미 사용된 초대 코드입니다')
  if (invite.email !== null && invite.email !== email) throw Errors.badRequest('이 초대 코드는 다른 이메일에 발급되었습니다')

  const existing = await db.users.findByEmail(email)
  if (existing) throw Errors.badRequest('이미 가입된 이메일입니다. 로그인을 이용해주세요.')

  const user = await db.users.create({
    email,
    name: name || email.split('@')[0],
    is_beta_tester: true,
  })
  await db.inviteCodes.markUsed(invite.id)
  await db.users.updatePasswordHash(user.id, await hashPassword(password))

  const now = Math.floor(Date.now() / 1000)
  const token = await sign(
    { sub: user.id, email: user.email, tier: user.tier, iat: now, exp: now + TOKEN_TTL_SECONDS },
    c.env.JWT_SECRET,
    'HS256',
  )

  return c.json(
    {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        is_beta_tester: user.is_beta_tester,
      },
    },
    201,
  )
})

auth.post('/login', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>().catch(() => ({}))

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !EMAIL_RE.test(email)) throw Errors.badRequest('유효한 이메일 주소를 입력해주세요')
  if (!password) throw Errors.badRequest('비밀번호를 입력해주세요')

  const db = createDbClient(c.env)
  const user = await db.users.findByEmail(email)

  if (!user || !user.password_hash || !(await verifyPassword(password, user.password_hash))) {
    throw Errors.unauthorized()
  }

  const now = Math.floor(Date.now() / 1000)
  const token = await sign(
    { sub: user.id, email: user.email, tier: user.tier, iat: now, exp: now + TOKEN_TTL_SECONDS },
    c.env.JWT_SECRET,
    'HS256',
  )

  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      is_beta_tester: user.is_beta_tester,
    },
  })
})

export { auth }
