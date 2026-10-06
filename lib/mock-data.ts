export type UserRole = 'worker' | 'client' | 'admin';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'completed';
export type GigStatus = 'open' | 'closed' | 'completed' | 'cancelled';
export type VerificationStatus = 'unverified' | 'pending' | 'verified';
export type ReportStatus = 'open' | 'investigating' | 'resolved';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  location: string;
  profile_photo_url: string;
  created_at: string;
  updated_at: string;
}

export interface WorkerProfile {
  id: string;
  user_id: string;
  full_name: string;
  location: string;
  bio: string;
  skills: string[];
  experience: string;
  transport_available: boolean;
  preferred_categories: string[];
  rating: number;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface ClientProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  description: string;
  rating: number;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface Gig {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  description: string;
  category: string;
  location_area: string;
  address_private: string;
  date: string;
  start_time: string;
  end_time: string;
  pay_amount: number;
  workers_needed: number;
  requirements: string;
  status: GigStatus;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  gig_id: string;
  gig_title: string;
  worker_id: string;
  worker_name: string;
  message: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  reported_by: string;
  reported_user_id: string | null;
  gig_id: string | null;
  reason: string;
  description: string;
  status: ReportStatus;
  created_at: string;
}

export interface Review {
  id: string;
  gig_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export const mockUsers: User[] = [
  {
    id: 'user_1',
    full_name: 'Anele Mpofu',
    email: 'anele@example.com',
    phone: '+27 82 123 4567',
    role: 'worker',
    location: 'Cape Town',
    profile_photo_url: '',
    created_at: '2026-05-10',
    updated_at: '2026-05-10',
  },
  {
    id: 'user_2',
    full_name: 'Nandi Khumalo',
    email: 'nandi@example.com',
    phone: '+27 71 987 6543',
    role: 'client',
    location: 'Johannesburg',
    profile_photo_url: '',
    created_at: '2026-05-07',
    updated_at: '2026-05-07',
  },
  {
    id: 'user_3',
    full_name: 'Sipho Madlala',
    email: 'sipho@example.com',
    phone: '+27 74 555 8888',
    role: 'admin',
    location: 'Durban',
    profile_photo_url: '',
    created_at: '2026-05-01',
    updated_at: '2026-05-01',
  },
  {
    id: 'user_4',
    full_name: 'Thandi Jacobs',
    email: 'thandi@example.com',
    phone: '+27 79 222 0044',
    role: 'worker',
    location: 'Soweto',
    profile_photo_url: '',
    created_at: '2026-05-12',
    updated_at: '2026-05-12',
  },
  {
    id: 'user_5',
    full_name: 'Musa Dlamini',
    email: 'musa@example.com',
    phone: '+27 83 441 2050',
    role: 'client',
    location: 'Durban',
    profile_photo_url: '',
    created_at: '2026-05-14',
    updated_at: '2026-05-14',
  },
];

export const mockWorkerProfiles: WorkerProfile[] = [
  {
    id: 'worker_1',
    user_id: 'user_1',
    full_name: 'Anele Mpofu',
    location: 'Cape Town',
    bio: 'Student and freelancer available for local delivery, events, and short daily jobs.',
    skills: ['Delivery', 'Events', 'Customer support'],
    experience: '2 years of hospitality and on-demand errands.',
    transport_available: true,
    preferred_categories: ['Delivery', 'Events', 'Home'],
    rating: 4.8,
    verification_status: 'pending',
    created_at: '2026-05-10',
    updated_at: '2026-05-10',
  },
  {
    id: 'worker_2',
    user_id: 'user_4',
    full_name: 'Thandi Jacobs',
    location: 'Soweto',
    bio: 'Reliable student worker for promotions, tutoring support, and weekend shifts.',
    skills: ['Promotions', 'Tutoring support', 'Retail'],
    experience: 'Part-time retail assistant and campus event ambassador.',
    transport_available: false,
    preferred_categories: ['Events', 'Retail', 'Admin'],
    rating: 4.6,
    verification_status: 'verified',
    created_at: '2026-05-12',
    updated_at: '2026-05-12',
  },
];

export const mockClientProfiles: ClientProfile[] = [
  {
    id: 'client_1',
    user_id: 'user_2',
    business_name: 'Khumalo Eats',
    business_type: 'Food delivery',
    description: 'Local delivery and pop-up stall services across Joburg.',
    rating: 4.9,
    verification_status: 'verified',
    created_at: '2026-05-07',
    updated_at: '2026-05-07',
  },
  {
    id: 'client_2',
    user_id: 'user_5',
    business_name: 'Dlamini Digital',
    business_type: 'Creative agency',
    description: 'Small agency hiring youth freelancers for local brand activations.',
    rating: 4.7,
    verification_status: 'pending',
    created_at: '2026-05-14',
    updated_at: '2026-05-14',
  },
];

export const mockGigs: Gig[] = [
  {
    id: 'gig_1',
    client_id: 'user_2',
    client_name: 'Khumalo Eats',
    title: 'Event assistant for food stall',
    description: 'Help serve customers and restock supplies at a local food market.',
    category: 'Events',
    location_area: 'Braamfontein, Johannesburg',
    address_private: '21 Juta Street',
    date: '2026-06-02',
    start_time: '10:00',
    end_time: '15:00',
    pay_amount: 250,
    workers_needed: 2,
    requirements: 'Friendly, able to stand for several hours, reliable transport preferred.',
    status: 'open',
    created_at: '2026-05-20',
    updated_at: '2026-05-20',
  },
  {
    id: 'gig_2',
    client_id: 'user_2',
    client_name: 'Khumalo Eats',
    title: 'Delivery runner for quick packages',
    description: 'Collect and deliver parcels across central Cape Town.',
    category: 'Delivery',
    location_area: 'Cape Town CBD',
    address_private: 'Office 4, 33 Loop Street',
    date: '2026-06-04',
    start_time: '09:00',
    end_time: '12:00',
    pay_amount: 180,
    workers_needed: 1,
    requirements: 'Must know local streets and be comfortable with short-distance tasks.',
    status: 'open',
    created_at: '2026-05-19',
    updated_at: '2026-05-19',
  },
  {
    id: 'gig_3',
    client_id: 'user_2',
    client_name: 'Khumalo Eats',
    title: 'Cleaning helper for pop-up kitchen',
    description: 'Assist with light cleaning and set-up before a dinner shift.',
    category: 'Home',
    location_area: 'Salt River, Cape Town',
    address_private: 'Private kitchen location',
    date: '2026-06-05',
    start_time: '12:00',
    end_time: '16:00',
    pay_amount: 220,
    workers_needed: 1,
    requirements: 'Responsible and able to follow hygiene guidelines.',
    status: 'open',
    created_at: '2026-05-18',
    updated_at: '2026-05-18',
  },
  {
    id: 'gig_4',
    client_id: 'user_5',
    client_name: 'Dlamini Digital',
    title: 'Promo team member for campus launch',
    description: 'Hand out flyers, explain the offer, and help capture sign-ups for a youth brand launch.',
    category: 'Promotions',
    location_area: 'Soweto, Johannesburg',
    address_private: 'Shared after acceptance',
    date: '2026-06-07',
    start_time: '11:00',
    end_time: '17:00',
    pay_amount: 320,
    workers_needed: 4,
    requirements: 'Confident communicator, neat presentation, phone with WhatsApp access.',
    status: 'open',
    created_at: '2026-05-23',
    updated_at: '2026-05-23',
  },
  {
    id: 'gig_5',
    client_id: 'user_5',
    client_name: 'Dlamini Digital',
    title: 'Basic laptop setup assistant',
    description: 'Help set up laptops, install approved apps, and label equipment for a small training session.',
    category: 'Tech',
    location_area: 'Umhlanga, Durban',
    address_private: 'Office park address private',
    date: '2026-06-09',
    start_time: '08:30',
    end_time: '12:30',
    pay_amount: 280,
    workers_needed: 2,
    requirements: 'Comfortable with Windows setup, punctual, able to follow a checklist.',
    status: 'closed',
    created_at: '2026-05-24',
    updated_at: '2026-05-25',
  },
];

export const mockApplications: Application[] = [
  {
    id: 'app_1',
    gig_id: 'gig_1',
    gig_title: 'Event assistant for food stall',
    worker_id: 'user_4',
    worker_name: 'Thandi Jacobs',
    message: 'I am available and experienced with promotions, events, and customer-facing work.',
    status: 'pending',
    created_at: '2026-05-21',
    updated_at: '2026-05-21',
  },
  {
    id: 'app_2',
    gig_id: 'gig_2',
    gig_title: 'Delivery runner for quick packages',
    worker_id: 'user_1',
    worker_name: 'Anele Mpofu',
    message: 'I know Cape Town well and can deliver on time.',
    status: 'accepted',
    created_at: '2026-05-21',
    updated_at: '2026-05-22',
  },
  {
    id: 'app_3',
    gig_id: 'gig_4',
    gig_title: 'Promo team member for campus launch',
    worker_id: 'user_4',
    worker_name: 'Thandi Jacobs',
    message: 'I have promo and retail experience and can work the full shift.',
    status: 'pending',
    created_at: '2026-05-24',
    updated_at: '2026-05-24',
  },
  {
    id: 'app_4',
    gig_id: 'gig_5',
    gig_title: 'Basic laptop setup assistant',
    worker_id: 'user_1',
    worker_name: 'Anele Mpofu',
    message: 'I can follow the setup checklist and have basic IT support experience.',
    status: 'completed',
    created_at: '2026-05-24',
    updated_at: '2026-05-25',
  },
];

export const mockReports: Report[] = [
  {
    id: 'report_1',
    reported_by: 'user_1',
    reported_user_id: 'user_2',
    gig_id: 'gig_3',
    reason: 'Late communication',
    description: 'The client has not responded after I applied to the gig.',
    status: 'open',
    created_at: '2026-05-22',
  },
];

export const mockReviews: Review[] = [
  {
    id: 'review_1',
    gig_id: 'gig_5',
    reviewer_id: 'user_5',
    reviewed_user_id: 'user_1',
    rating: 5,
    comment: 'Arrived early and completed the setup checklist carefully.',
    created_at: '2026-05-25',
  },
];

export const gigCategories = ['Delivery', 'Events', 'Tech', 'Home', 'Cleaning', 'Promotions', 'Retail', 'Admin'];
