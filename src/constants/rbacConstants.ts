export interface RbacItem {
  'module name': string;
  Create: 'true' | 'false';
  Read: 'true' | 'false';
  Update: 'true' | 'false';
  Delete: 'true' | 'false';
}

export const ALL_MODULE_NAMES = [
  'Monuments & Landmarks',
  'Vector Floor Maps',
  'Viewpoint Hotspots',
  'Audio Guides & Narration',
  'Languages & Localization',
  'Walking Tour Itineraries',
  'Pedestrian Street Routes',
  'GPS Geofencing & Tracking',
  'Sync Bundles & Manifests',
  'Mobile Client Offline Cache',
  'Access & Tickets',
  'Park Configuration',
  'Staff & User Accounts',
  'Role-Based Access Control',
  'Analytics & Visitor Telemetry',
] as const;

export type SystemModuleName = (typeof ALL_MODULE_NAMES)[number];

export const ROLE_RBAC_MATRIX: Record<string, Record<SystemModuleName, {
  Create: 'true' | 'false';
  Read: 'true' | 'false';
  Update: 'true' | 'false';
  Delete: 'true' | 'false';
}>> = {
  super_admin: {
    'Monuments & Landmarks': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Vector Floor Maps': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Viewpoint Hotspots': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Audio Guides & Narration': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Languages & Localization': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Walking Tour Itineraries': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Pedestrian Street Routes': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'GPS Geofencing & Tracking': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Sync Bundles & Manifests': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Mobile Client Offline Cache': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Access & Tickets': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Park Configuration': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Staff & User Accounts': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Role-Based Access Control': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Analytics & Visitor Telemetry': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
  },
  admin: {
    'Monuments & Landmarks': { Create: 'true', Read: 'true', Update: 'true', Delete: 'false' },
    'Vector Floor Maps': { Create: 'true', Read: 'true', Update: 'true', Delete: 'false' },
    'Viewpoint Hotspots': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Audio Guides & Narration': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Languages & Localization': { Create: 'true', Read: 'true', Update: 'true', Delete: 'false' },
    'Walking Tour Itineraries': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Pedestrian Street Routes': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'GPS Geofencing & Tracking': { Create: 'false', Read: 'true', Update: 'true', Delete: 'false' },
    'Sync Bundles & Manifests': { Create: 'true', Read: 'true', Update: 'true', Delete: 'false' },
    'Mobile Client Offline Cache': { Create: 'false', Read: 'true', Update: 'true', Delete: 'false' },
    'Access & Tickets': { Create: 'true', Read: 'true', Update: 'true', Delete: 'false' },
    'Park Configuration': { Create: 'false', Read: 'true', Update: 'true', Delete: 'false' },
    'Staff & User Accounts': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Role-Based Access Control': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Analytics & Visitor Telemetry': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
  },
  moderator: {
    'Monuments & Landmarks': { Create: 'false', Read: 'true', Update: 'true', Delete: 'false' },
    'Vector Floor Maps': { Create: 'false', Read: 'false', Update: 'false', Delete: 'false' },
    'Viewpoint Hotspots': { Create: 'true', Read: 'true', Update: 'true', Delete: 'false' },
    'Audio Guides & Narration': { Create: 'true', Read: 'true', Update: 'true', Delete: 'false' },
    'Languages & Localization': { Create: 'false', Read: 'true', Update: 'true', Delete: 'false' },
    'Walking Tour Itineraries': { Create: 'true', Read: 'true', Update: 'true', Delete: 'false' },
    'Pedestrian Street Routes': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'GPS Geofencing & Tracking': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Sync Bundles & Manifests': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Mobile Client Offline Cache': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Access & Tickets': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Park Configuration': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Staff & User Accounts': { Create: 'false', Read: 'false', Update: 'false', Delete: 'false' },
    'Role-Based Access Control': { Create: 'false', Read: 'false', Update: 'false', Delete: 'false' },
    'Analytics & Visitor Telemetry': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
  },
  user: {
    'Monuments & Landmarks': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Vector Floor Maps': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Viewpoint Hotspots': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Audio Guides & Narration': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Languages & Localization': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Walking Tour Itineraries': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Pedestrian Street Routes': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'GPS Geofencing & Tracking': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Sync Bundles & Manifests': { Create: 'false', Read: 'false', Update: 'false', Delete: 'false' },
    'Mobile Client Offline Cache': { Create: 'false', Read: 'false', Update: 'false', Delete: 'false' },
    'Access & Tickets': { Create: 'false', Read: 'false', Update: 'false', Delete: 'false' },
    'Park Configuration': { Create: 'false', Read: 'false', Update: 'false', Delete: 'false' },
    'Staff & User Accounts': { Create: 'false', Read: 'false', Update: 'false', Delete: 'false' },
    'Role-Based Access Control': { Create: 'false', Read: 'false', Update: 'false', Delete: 'false' },
    'Analytics & Visitor Telemetry': { Create: 'false', Read: 'false', Update: 'false', Delete: 'false' },
  },
};

export const getRoleRbac = (role: string): RbacItem[] => {
  const normalized = role.toLowerCase();
  const matrix = ROLE_RBAC_MATRIX[normalized] || ROLE_RBAC_MATRIX.user;

  return ALL_MODULE_NAMES.map((moduleName) => {
    const perm = matrix[moduleName] || {
      Create: 'false',
      Read: 'false',
      Update: 'false',
      Delete: 'false',
    };
    return {
      'module name': moduleName,
      Create: perm.Create,
      Read: perm.Read,
      Update: perm.Update,
      Delete: perm.Delete,
    };
  });
};
