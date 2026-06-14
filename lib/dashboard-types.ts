export type DashboardTab =
  | 'calendar'
  | 'day'
  | 'add'
  | 'blob'
  | 'edit'
  | 'search'
  | 'tags'
  | 'tag'
  | 'stats'
  | 'profile';

export type SearchScope = 'all' | 'blobs' | 'tags';
export type TagMode = 'recent' | 'popular';
export type StatsPeriod = 'week' | 'month';
