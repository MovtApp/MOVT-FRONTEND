export interface TrainerProfile {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  coverUrl: string;
  isOnline: boolean;
  location: string;
  hasCurriculum: boolean;
}

export interface Post {
  id: string;
  imageUrl: string;
  alt: string;
  likes?: number;
  comments?: number;
}

export type TabType = "posts" | "destaques" | "marcados";
