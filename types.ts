
export type UserRole = 'admin' | 'cr' | 'pending';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  email: string;
  photo_url?: string;
  created_at: string;
}

export interface Student {
  id: string;
  roll_number: string;
  name: string;
  email: string;
  phone?: string;
  session: string;
  department: string;
  gender?: 'Male' | 'Female' | 'Other';
  photo_url?: string;
  created_at: string;
}

export interface Teacher {
  id: string;
  name: string;
  designation: string;
  department: string;
  degree: string;
  email: string;
  phone: string;
  photo_url?: string;
  bio?: string;
  priority: number;
  teacher_type: 'Major' | 'Non-Major' | 'Common';
  created_at: string;
}

export interface Routine {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
  subject: string;
  teacher_id: string;
  room_number: string;
  session: string;
  course_type: 'Major' | 'Non-Major' | 'Common';
  created_at: string;
  teachers?: {
    name: string;
  };
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  author_id: string;
  is_published: boolean;
  attachment_url?: string;
  created_at: string;
}

export interface Result {
  id: string;
  student_roll: string;
  student_name: string;
  subject_name: string;
  subject_code: string;
  marks: number;
  semester: string;
  remarks?: string;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
}
