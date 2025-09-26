export type CeremonyType = 'kosciol' | 'cywilny' | 'plener';
export type DayStyle = 'slow' | 'standard' | 'dynamic';
export type Role = 'Para' | 'Foto' | 'Wideo' | 'MUAH' | 'DJ' | 'Goscie' | 'Inne';

export interface Location {
  label: string;
  address?: string;
  lat?: number;
  lng?: number;
  kmFromPrev?: number;
}

export interface Attendee {
  name: string;
  email?: string;
  phone?: string;
  role?: Role;
}

export interface TimelineEvent {
  id: string;
  title: string;
  role: Role[];
  start: string;
  end: string;
  fixed?: boolean;
  location?: Location;
  notes?: string;
}

export interface Timeline {
  id: string;
  date: string;
  ceremonyType: CeremonyType;
  style: DayStyle;
  baseLocations: {
    gettingReady?: Location;
    ceremony?: Location;
    portrait?: Location;
    reception?: Location;
  };
  attendees: Attendee[];
  events: TimelineEvent[];
  publicId?: string;
  pin?: string;
  lastUpdated?: string;
  comments?: CommentEntry[];
}

export interface CommentEntry {
  id: number;
  author: string;
  comment_text: string;
  created_at: string;
}
