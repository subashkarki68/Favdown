export interface SpotifyProfileData {
  display_name: string;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: any[];
  type: string;
  uri: string;
  followers: Followers;
  email: string;
}

export interface ExternalUrls {
  spotify: string;
}

export interface Followers {
  href: null;
  total: number;
}
