# Mô tả tính năng và Schema Design cho ứng dụng Roadmap

## I. Mô tả tính năng

### 1. Quản lý người dùng và xác thực
- **Đăng nhập bằng email**: Sử dụng hệ thống xác thực của Supabase (auth.users).
- **Hai loại người dùng**: 
  - User thông thường: Quyền truy cập giới hạn theo vai trò trong roadmap.
  - Admin: Quyền xem và quản lý tất cả roadmap trên hệ thống.
- **Hồ sơ người dùng**: Quản lý thông tin cá nhân (tên, email, ảnh đại diện).
- **Mời người dùng**: Gửi email mời tham gia roadmap với vai trò cụ thể.

### 2. Quản lý roadmap
- **Tạo roadmap**: Người dùng có thể tạo nhiều roadmap với tên, mô tả, thời gian và mục tiêu cụ thể.
- **Thêm thành viên**: Mời người dùng khác tham gia roadmap với vai trò (owner, editor, viewer).
- **Chia sẻ công khai**: Tạo link rút gọn để chia sẻ roadmap công khai, không yêu cầu đăng nhập.
- **Quản lý thời gian**: Thiết lập khung thời gian (ngày bắt đầu, kết thúc) và các mốc quan trọng (milestones).
- **Admin access**: Admin có quyền xem và quản lý tất cả roadmap, kể cả những roadmap đã xóa mềm.

### 3. Quản lý posts (features, goals)
- **Tạo và chỉnh sửa post**: Người dùng tạo các mục tiêu hoặc tính năng với thông tin chi tiết.
- **Thuộc tính post**:
  - Tiêu đề và mô tả.
  - Trạng thái (tùy chỉnh theo roadmap).
  - Ngày bắt đầu, ngày kết thúc, thời gian dự kiến hoàn thành (ETA).
  - Thẻ gắn (tags) để phân loại.
  - Mức độ ưu tiên: Thấp, Trung bình, Cao, Khẩn cấp.
  - Tiến độ: Phần trăm hoàn thành (0-100%).
  - Phân công người thực hiện (assignee).
- **Bình luận và tương tác**: Thảo luận trên post, đề cập người dùng bằng cách đánh dấu (@username).
- **Tệp đính kèm**: Tải lên và quản lý tệp liên quan (hình ảnh, tài liệu).

### 4. Các chế độ xem và trực quan hóa
- **Chế độ xem trạng thái (Kanban)**:
  - Bảng cột theo trạng thái (status).
  - Kéo thả post giữa các trạng thái.
  - Chỉ báo trực quan cho mức độ ưu tiên và tiến độ.
- **Chế độ xem dòng thời gian (Gantt)**:
  - Biểu đồ Gantt hiển thị các post theo thời gian.
  - Trực quan hóa phụ thuộc giữa các post bằng đường kết nối.
  - Đánh dấu các mốc quan trọng.
- **Chế độ xem hàng tháng/quý**:
  - Tổ chức post theo tháng hoặc quý.
  - Thống kê tiến độ và mức độ hoàn thành.
- **Chế độ xem trực quan hóa**:
  - Biểu đồ (bar, line) và đồ thị (burndown) hiển thị tiến độ.
  - Phân tích xu hướng và hiệu suất.

### 5. Hệ thống lọc và sắp xếp
- **Tìm kiếm toàn văn**: Tìm kiếm nhanh post và roadmap dựa trên nội dung.
- **Bộ lọc**: Lọc theo trạng thái, ngày tháng, ưu tiên, người thực hiện.
- **Sắp xếp**: Sắp xếp linh hoạt theo nhiều tiêu chí (ngày, ưu tiên, tiến độ).

### 6. Quản lý phụ thuộc
- **Xác định phụ thuộc**: Thiết lập mối quan hệ giữa các post (blocks, blocked_by, relates_to, duplicates).
- **Trực quan hóa phụ thuộc**: Hiển thị các post đang chặn hoặc bị chặn.
- **Phân tích tác động**: Đánh giá ảnh hưởng của sự chậm trễ lên các post khác.

### 7. Thông báo và hoạt động
- **Nhật ký hoạt động**: Ghi lại mọi thay đổi trong roadmap (tạo, cập nhật, xóa).
- **Thông báo**: Gửi thông báo về các thay đổi liên quan (phân công, bình luận, đề cập).
- **Đề cập người dùng**: Đánh dấu người dùng trong bình luận để thông báo.

## II. Schema Design cho Supabase

### 1. Người dùng và xác thực
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}'::JSONB,
  last_active_roadmap_id UUID REFERENCES roadmaps(id)
);

CREATE INDEX idx_users_admin ON users(is_admin);
```

### 2. Roadmap
```sql
CREATE TABLE roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  is_public BOOLEAN DEFAULT FALSE,
  public_share_id TEXT UNIQUE,
  public_share_created_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}'::JSONB,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE roadmap_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  UNIQUE(roadmap_id, user_id)
);

CREATE TABLE statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(roadmap_id, name)
);

CREATE INDEX idx_roadmaps_owner ON roadmaps(owner_id);
CREATE INDEX idx_roadmaps_status ON roadmaps(status);
CREATE INDEX idx_roadmaps_dates ON roadmaps(start_date, end_date);
CREATE INDEX idx_roadmaps_public ON roadmaps(is_public);
CREATE INDEX idx_roadmaps_public_share ON roadmaps(public_share_id);
CREATE INDEX idx_roadmaps_deleted ON roadmaps(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_roadmap_members_roadmap ON roadmap_members(roadmap_id);
CREATE INDEX idx_roadmap_members_user ON roadmap_members(user_id);
CREATE INDEX idx_statuses_roadmap ON statuses(roadmap_id);
```

### 3. Posts và phụ thuộc
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status_id UUID NOT NULL REFERENCES statuses(id) ON DELETE RESTRICT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  eta TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  progress INTEGER CHECK (progress >= 0 AND progress <= 100),
  assignee_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  parent_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::JSONB,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  target_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'blocks' CHECK (type IN ('blocks', 'blocked_by', 'relates_to', 'duplicates')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE(source_post_id, target_post_id)
);

CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_posts_roadmap ON posts(roadmap_id);
CREATE INDEX idx_posts_status ON posts(status_id);
CREATE INDEX idx_posts_assignee ON posts(assignee_id);
CREATE INDEX idx_posts_priority ON posts(priority);
CREATE INDEX idx_posts_dates ON posts(start_date, end_date, eta);
CREATE INDEX idx_posts_tags ON posts USING gin(tags);
CREATE INDEX idx_dependencies_source ON dependencies(source_post_id);
CREATE INDEX idx_dependencies_target ON dependencies(target_post_id);
CREATE INDEX idx_milestones_roadmap ON milestones(roadmap_id);
CREATE INDEX idx_milestones_date ON milestones(date);
```

### 4. Views và dashboard
```sql
-- Tạo bảng views mà không có ràng buộc UNIQUE có điều kiện
CREATE TABLE views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('status', 'timeline', 'month', 'quarter', 'dependency', 'gantt', 'calendar', 'analytics', 'burndown', 'custom')),
  config JSONB DEFAULT '{}'::JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  is_personal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo chỉ mục duy nhất cho các view cá nhân
CREATE UNIQUE INDEX unique_personal_view 
ON views (roadmap_id, title, created_by) 
WHERE is_personal = TRUE;

-- Tạo chỉ mục duy nhất cho các view không phải cá nhân
CREATE UNIQUE INDEX unique_non_personal_view 
ON views (roadmap_id, title) 
WHERE is_personal = FALSE;

-- Giữ nguyên các chỉ mục khác để tối ưu hóa truy vấn
CREATE INDEX idx_views_roadmap ON views(roadmap_id);
CREATE INDEX idx_views_type ON views(type);
```

### 5. Tương tác và tài liệu
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT FALSE,
  mentioned_users UUID[] DEFAULT '{}'
);

CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  is_image BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT
);

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_mentioned_users ON comments USING gin(mentioned_users);
CREATE INDEX idx_attachments_post ON attachments(post_id);
CREATE INDEX idx_logs_roadmap ON activity_logs(roadmap_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_invitations_roadmap ON invitations(roadmap_id);
```

## III. Row Level Security (RLS) cho Supabase

### 1. Bảng roadmaps
```sql
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_view_all_roadmaps ON roadmaps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE)
  );

CREATE POLICY member_view_roadmaps ON roadmaps
  FOR SELECT USING (
    (EXISTS (SELECT 1 FROM roadmap_members WHERE roadmap_members.roadmap_id = roadmaps.id AND roadmap_members.user_id = auth.uid())
    OR roadmaps.owner_id = auth.uid())
    AND roadmaps.deleted_at IS NULL
  );

CREATE POLICY public_view_roadmaps ON roadmaps
  FOR SELECT USING (
    roadmaps.is_public = TRUE AND roadmaps.deleted_at IS NULL
  );

CREATE POLICY update_roadmaps ON roadmaps
  FOR UPDATE USING (
    (roadmaps.owner_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE))
    AND roadmaps.deleted_at IS NULL
  );

CREATE POLICY insert_roadmaps ON roadmaps
  FOR INSERT WITH CHECK (
    auth.uid() = roadmaps.owner_id
  );
```

### 2. Bảng posts
```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY view_posts ON posts
  FOR SELECT USING (
    (EXISTS (SELECT 1 FROM roadmap_members WHERE roadmap_members.roadmap_id = posts.roadmap_id AND roadmap_members.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM roadmaps WHERE roadmaps.id = posts.roadmap_id AND roadmaps.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE))
    AND posts.deleted_at IS NULL
  );

CREATE POLICY manage_posts ON posts
  FOR ALL USING (
    (EXISTS (SELECT 1 FROM roadmap_members WHERE roadmap_members.roadmap_id = posts.roadmap_id AND roadmap_members.user_id = auth.uid() AND roadmap_members.role IN ('editor', 'owner'))
    OR EXISTS (SELECT 1 FROM roadmaps WHERE roadmaps.id = posts.roadmap_id AND roadmaps.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE))
    AND posts.deleted_at IS NULL
  );
```

*Lưu ý: Các chính sách RLS tương tự có thể được áp dụng cho các bảng khác như comments, attachments, v.v., tùy theo yêu cầu cụ thể.*

## IV. Khuyến nghị triển khai

### Chia sẻ công khai:
- Tạo function SQL để sinh public_share_id ngẫu nhiên khi bật chế độ chia sẻ công khai.
- Cung cấp API endpoint cho phép truy cập công khai mà không cần đăng nhập.
- Thêm watermark hoặc ghi nhận nguồn vào roadmap công khai để bảo vệ nội dung.

### Bảo mật và kiểm soát quyền:
- Sử dụng RLS để phân quyền chi tiết cho từng hành động (SELECT, INSERT, UPDATE, DELETE).
- Viết các function helper trong Supabase để kiểm tra quyền trước khi thực hiện các hành động quan trọng.

### Quản lý thông báo:
- Tạo trigger trong database để tự động ghi thông báo khi có thay đổi (phân công, bình luận, v.v.).
- Sử dụng Supabase Realtime để gửi thông báo thời gian thực đến người dùng.

### Tối ưu hiệu suất:
- Sử dụng materialized views cho các báo cáo hoặc dashboard phức tạp.
- Thiết lập database pooling và caching cho các truy vấn phổ biến như danh sách roadmap hoặc post.

### Quản lý tags và mentioned_users:
- Nếu quy mô ứng dụng lớn, cân nhắc tách tags và mentioned_users thành bảng riêng để tối ưu truy vấn.
- Sử dụng GIN index cho các cột mảng như tags và mentioned_users để tăng tốc độ tìm kiếm.