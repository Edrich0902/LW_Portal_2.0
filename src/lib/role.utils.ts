export const formatRoleLabel = (role?: string | null) => {
  if (!role) return 'No Role'

  return role
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const normalizeRoleName = (role?: string | null) => {
  return (role ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}
