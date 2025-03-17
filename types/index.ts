export interface User {
  id: string;
  email: string;
  display_name?: string;
}

export interface Roadmap {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  owner_id: string;
  profiles?: User;
}

export interface Status {
  id: string;
  name: string;
  color: string;
  roadmap_id: string;
  order: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  roadmap_id: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string | null;
  roadmap_id: string;
  status_id: string | null;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  start_date: string | null;
  due_date: string | null;
  order: number;
  status?: Status;
  assignee?: User;
  tags?: Tag[];
} 