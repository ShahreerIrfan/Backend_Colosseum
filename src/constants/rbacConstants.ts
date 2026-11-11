export interface RbacItem {
  'module name': string;
  Create: 'true' | 'false';
  Read: 'true' | 'false';
  Update: 'true' | 'false';
  Delete: 'true' | 'false';
}

const crud = ['Create', 'Read', 'Update', 'Delete'] as const;
export type CrudAction = (typeof crud)[number];

export const ADMIN_MODULE_ACTIONS = {
  'Analytics & Visitor Telemetry': ['Read'],
  'Monuments & Landmarks': crud,
  'Vector Floor Maps': crud,
  'Viewpoint Hotspots': crud,
  'Floor Itinerary': crud,
  'Pedestrian Street Routes': crud,
  'Role-Based Access Control': crud,
  'Staff & User Accounts': crud,
  'Languages & Localization': crud,
} as const satisfies Record<string, readonly CrudAction[]>;

export type SystemModuleName = keyof typeof ADMIN_MODULE_ACTIONS;

const ROLE_ACTIONS: Record<string, Partial<Record<SystemModuleName, readonly CrudAction[]>>> = {
  admin: {
    'Analytics & Visitor Telemetry': ['Read'],
    'Monuments & Landmarks': ['Create', 'Read', 'Update'],
    'Vector Floor Maps': ['Create', 'Read', 'Update'],
    'Viewpoint Hotspots': crud,
    'Floor Itinerary': crud,
    'Pedestrian Street Routes': crud,
    'Role-Based Access Control': ['Read'],
    'Staff & User Accounts': crud,
    'Languages & Localization': ['Create', 'Read', 'Update'],
  },
  moderator: {
    'Monuments & Landmarks': ['Read', 'Update'],
    'Viewpoint Hotspots': ['Create', 'Read', 'Update'],
    'Pedestrian Street Routes': ['Read'],
    'Languages & Localization': ['Read', 'Update'],
  },
  user: {
    'Monuments & Landmarks': ['Read'],
    'Vector Floor Maps': ['Read'],
    'Viewpoint Hotspots': ['Read'],
    'Pedestrian Street Routes': ['Read'],
    'Languages & Localization': ['Read'],
  },
};

export const getRoleRbac = (role: string): RbacItem[] => {
  const normalized = role.toLowerCase();
  const matrix = ROLE_ACTIONS[normalized] ?? ROLE_ACTIONS.user;
  return (Object.keys(ADMIN_MODULE_ACTIONS) as SystemModuleName[]).map((moduleName) => {
    const actions: readonly CrudAction[] = normalized === 'super_admin'
      ? ADMIN_MODULE_ACTIONS[moduleName] : matrix[moduleName] ?? [];
    const flag = (action: CrudAction) => actions.includes(action) ? 'true' : 'false';
    return { 'module name': moduleName, Create: flag('Create'), Read: flag('Read'), Update: flag('Update'), Delete: flag('Delete') };
  });
};
