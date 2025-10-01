declare namespace User {
  interface UserInfo {
    token: string;
    user_id: Number;
  }

  interface CurrentUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    community_id?: string;
    community_name?: string;
  }
}
