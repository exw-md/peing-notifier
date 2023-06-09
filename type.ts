export type Question = {
  id: number;
  get_user_id: number;
  body: string;
  enum_status: string;
  uuid_hash: string;
  eye_catch: {
    url: string;
  };
  locale: string;
  country: null;
  hope_answer_type: string;
  make_item_url: string;
  created_at: Date;
  updated_at: Date;
  time: string;
  newer: boolean;
  hope_video: boolean;
  hope_audio: boolean;
  item_url: string;
  answer_url: string;
  unread: boolean;
  read: boolean;
  dust: boolean;
  eye_catch_url: string;
  answer_body: null;
  active_broadcast_banner: null;
  is_popular_community_item: boolean;
  is_liked: boolean;
  is_receive_dm: boolean;
  is_choose_question: boolean;
};

export type PermanentData = {
  lastUpdatedAt: string;
}
