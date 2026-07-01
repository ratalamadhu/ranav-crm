export const ROLES = {
  ADMIN:       'admin',
  MD:          'md',
  DIRECTOR:    'director',
  AGENT:       'agent',
  COORDINATOR: 'coordinator',
}

export const ROLE_LABELS = {
  admin:       'Admin',
  md:          'Managing Director',
  director:    'Director',
  agent:       'Sales Agent',
  coordinator: 'Coordinator',
}

/** Roles that can see all leads across all agents */
export const FULL_ACCESS_ROLES = [ROLES.ADMIN, ROLES.MD, ROLES.DIRECTOR]

/** Roles that can manage agents and users */
export const MANAGER_ROLES = [ROLES.ADMIN, ROLES.MD]

/** Roles that can see the Agents page */
export const CAN_VIEW_AGENTS = [ROLES.ADMIN, ROLES.MD, ROLES.DIRECTOR]

/** Roles that can see the Reports page */
export const CAN_VIEW_REPORTS = [ROLES.ADMIN, ROLES.MD, ROLES.DIRECTOR]

/** Roles that can access the Inventory / Plot tracking page */
export const CAN_VIEW_INVENTORY = [ROLES.ADMIN, ROLES.MD, ROLES.DIRECTOR]
