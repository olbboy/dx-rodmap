export interface User {
  id: string;
  email: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Roadmap {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  is_public: boolean;
  public_share_id?: string | null;
  status: "active" | "completed" | "archived";
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  owner?: User;
}

export interface Status {
  id: string;
  roadmap_id: string;
  name: string;
  description?: string | null;
  color: string;
  order_index: number;
  is_default: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
}

export interface Post {
  id: string;
  roadmap_id: string;
  title: string;
  description: string | null;
  status_id: string;
  start_date: string | null;
  end_date: string | null;
  due_date: string | null;
  eta: string | null;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  progress: number | null;
  assignee_id: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string | null;
  parent_id: string | null;
  order_index: number;
  order?: number;
  metadata: Record<string, any> | null;
  deleted_at: string | null;
  status?: Status;
  assignee?: User;
  creator?: User;
  updater?: User;
}

export interface Tag {
  id: string;
  roadmap_id: string;
  name: string;
  color: string;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export interface RoadmapMember {
  id: string;
  roadmap_id: string;
  user_id: string;
  role: "owner" | "editor" | "viewer";
  added_at: string;
  added_by: string | null;
  user?: User;
}

export interface Milestone {
  id: string;
  roadmapId: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  color?: string;
  createdAt: string;
  updatedAt: string;
  is_completed?: boolean;
  completed_at?: string;
  completed_by?: string;
  created_by?: string;
  deleted_at?: string;
}

export enum DependencyType {
  FinishToStart = 'finish_to_start',
  StartToStart = 'start_to_start',
  FinishToFinish = 'finish_to_finish',
  StartToFinish = 'start_to_finish'
}

export interface Dependency {
  id: string;
  roadmapId: string;
  sourceId: string;
  targetId: string;
  dependencyType: DependencyType;
  createdAt: string;
  updatedAt: string;
  created_by?: string;
  source_post?: Post;
  target_post?: Post;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  mentioned_users: string[];
  user?: User;
  parent?: Comment;
}

export interface Attachment {
  id: string;
  post_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  description: string | null;
  is_image: boolean;
  thumbnail_url: string | null;
  uploader?: User;
}

export interface View {
  id: string;
  roadmap_id: string;
  title: string;
  description: string | null;
  type: "status" | "timeline" | "month" | "quarter" | "dependency" | "gantt" | "calendar" | "analytics" | "burndown" | "custom";
  config: Record<string, any>;
  is_default: boolean;
  is_personal: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
  creator?: User;
}

export interface ActivityLog {
  id: string;
  roadmap_id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  details: Record<string, any> | null;
  created_at: string;
  user?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  entity_type: string;
  entity_id: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface Invitation {
  id: string;
  email: string;
  roadmap_id: string;
  role: "editor" | "viewer";
  invited_by: string;
  token: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  roadmap?: Roadmap;
  inviter?: User;
} 