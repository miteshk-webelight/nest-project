export interface PostOfficeRecord {
  District: string;
  State: string;
}

export interface PostalApiResponse {
  Status: string;
  Message: string;
  PostOffice: PostOfficeRecord[] | null;
}
