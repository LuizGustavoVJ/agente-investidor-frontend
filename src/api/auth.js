import client from './client'

export const authAPI = {
  // Login do usuário
  login: (credentials) => {
    return client.post('/auth/login', {
      email: credentials.email,
      password: credentials.password
    })
  },

  // Registro de novo usuário
  register: (userData) => {
    return client.post('/auth/register', {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
      phone: userData.phone,
      acceptTerms: userData.acceptTerms
    })
  },

  // Logout do usuário
  logout: () => {
    return client.post('/auth/logout')
  },

  // Verificar status de autenticação
  checkAuth: () => {
    return client.get('/auth/me')
  },

  // Renovar token via cookie
  refreshToken: () => {
    return client.post('/auth/refresh')
  },

  // Atualizar perfil do usuário
  updateProfile: (profileData) => {
    return client.put('/auth/profile', profileData)
  },

  // Alterar senha
  changePassword: (passwordData) => {
    return client.put('/auth/password', {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword
    })
  },

  // Solicitar reset de senha
  requestPasswordReset: (email) => {
    return client.post('/auth/password/reset-request', { email })
  },

  // Confirmar reset de senha
  confirmPasswordReset: (resetData) => {
    return client.post('/auth/password/reset-confirm', {
      token: resetData.token,
      newPassword: resetData.newPassword,
      confirmPassword: resetData.confirmPassword
    })
  },

  // Verificar email
  verifyEmail: (token) => {
    return client.post('/auth/email/verify', { token })
  },

  // Reenviar email de verificação
  resendVerificationEmail: () => {
    return client.post('/auth/email/resend-verification')
  },

  // Obter configurações de segurança
  getSecuritySettings: () => {
    return client.get('/auth/security')
  },

  // Ativar/desativar 2FA
  toggle2FA: (enabled) => {
    return client.put('/auth/security/2fa', { enabled })
  },

  // Obter QR code para 2FA
  get2FAQRCode: () => {
    return client.get('/auth/security/2fa/qr')
  },

  // Verificar código 2FA
  verify2FA: (code) => {
    return client.post('/auth/security/2fa/verify', { code })
  }
}

