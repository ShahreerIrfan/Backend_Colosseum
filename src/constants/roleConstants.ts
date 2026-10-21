export const STAFF_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
} as const;

export type StaffRole = (typeof STAFF_ROLES)[keyof typeof STAFF_ROLES];

export const TICKET_TIERS = {
  GENERAL: 'general',
  ARENA_PRIORITY: 'arena_priority',
  FULL_ACCESS: 'full_access',
} as const;

export type TicketTier = (typeof TICKET_TIERS)[keyof typeof TICKET_TIERS];

export const ALL_STAFF_ROLES = Object.values(STAFF_ROLES);
export const ALL_TICKET_TIERS = Object.values(TICKET_TIERS);
