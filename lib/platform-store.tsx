'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type Application,
  type ApplicationStatus,
  type ClientProfile,
  type Gig,
  type GigStatus,
  type Message,
  type Review,
  type Notification,
  type Report,
  type ReportStatus,
  type User,
  type VerificationStatus,
  type WorkerProfile,
  mockApplications,
  mockClientProfiles,
  mockGigs,
  mockMessages,
  mockReviews,
  mockNotifications,
  mockReports,
  mockUsers,
  mockWorkerProfiles,
} from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type CreateGigInput = Omit<Gig, 'id' | 'client_name' | 'status' | 'created_at' | 'updated_at'>;
export type UpdateGigInput = Omit<CreateGigInput, 'client_id'>;
type CreateReportInput = Pick<Report, 'reported_by' | 'reported_user_id' | 'gig_id' | 'reason' | 'description'>;
type GigRow = Database['public']['Tables']['gigs']['Row'];
type ApplicationRow = Database['public']['Tables']['applications']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type WorkerProfileRow = Database['public']['Tables']['worker_profiles']['Row'];
type ClientProfileRow = Database['public']['Tables']['client_profiles']['Row'];
type ReportRow = Database['public']['Tables']['reports']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type ReviewRow = Database['public']['Tables']['reviews']['Row'];

export interface CreateReviewInput {
  gig_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment: string;
}
// public.public_profiles is a DB view (see 20260528000000 migration) exposing only
// non-sensitive columns of `users` to every authenticated user.
type PublicProfileRow = Database['public']['Views']['public_profiles']['Row'];

interface PlatformStoreValue {
  users: User[];
  workerProfiles: WorkerProfile[];
  clientProfiles: ClientProfile[];
  gigs: Gig[];
  applications: Application[];
  reports: Report[];
  messages: Message[];
  notifications: Notification[];
  emailNotifications: boolean;
  loading: boolean;
  isSupabaseConnected: boolean;
  createGig: (data: CreateGigInput) => Promise<Gig>;
  applyToGig: (data: { gig_id: string; worker_id: string; worker_name: string; message: string }) => Promise<Application>;
  createReport: (data: CreateReportInput) => Promise<Report>;
  sendMessage: (data: { application_id: string; sender_id: string; body: string }) => Promise<Message>;
  markThreadRead: (application_id: string, reader_id: string) => Promise<void>;
  reviews: Review[];
  addReview: (data: CreateReviewInput) => Promise<Review>;
  markNotificationsRead: (ids: string[]) => Promise<void>;
  setEmailNotifications: (userId: string, enabled: boolean) => Promise<void>;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => Promise<void>;
  updateGigStatus: (id: string, status: GigStatus) => Promise<void>;
  updateGig: (id: string, data: UpdateGigInput) => Promise<void>;
  updateVerificationStatus: (profileType: 'worker' | 'client', profileId: string, status: VerificationStatus) => Promise<void>;
  updateReportStatus: (id: string, status: ReportStatus) => Promise<void>;
  updateWorkerProfile: (userId: string, data: Partial<Pick<WorkerProfile, 'bio' | 'skills' | 'experience' | 'transport_available' | 'preferred_categories'>>) => Promise<void>;
  updateClientProfile: (userId: string, data: Partial<Pick<ClientProfile, 'business_name' | 'business_type' | 'description'>>) => Promise<void>;
  resetDemoData: () => void;
}

const STORE_KEY = 'quickgig-sa-demo-store-v2';
const PlatformStoreContext = createContext<PlatformStoreValue | undefined>(undefined);

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone ?? '',
    role: row.role,
    location: row.location ?? '',
    profile_photo_url: row.profile_photo_url ?? '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapPublicProfile(row: PublicProfileRow): User {
  return {
    id: row.id,
    full_name: row.full_name,
    email: '',
    phone: '',
    role: row.role,
    location: row.location ?? '',
    profile_photo_url: row.profile_photo_url ?? '',
    created_at: row.created_at,
    updated_at: row.created_at,
  };
}

// RLS on public.users only returns the caller's own row (or every row, for admins).
// public.public_profiles returns everyone's non-sensitive fields. Merge them so every
// user sees names/locations for display, while email/phone stay visible only where
// the database actually allows it (self or admin).
function mergeUsers(publicRows: PublicProfileRow[], ownRows: UserRow[]): User[] {
  const merged = new Map<string, User>(publicRows.map((row) => [row.id, mapPublicProfile(row)]));
  for (const row of ownRows) {
    merged.set(row.id, mapUser(row));
  }
  return Array.from(merged.values());
}

function mapWorkerProfile(row: WorkerProfileRow, usersById: Map<string, User>): WorkerProfile {
  const user = usersById.get(row.user_id);
  return {
    id: row.id,
    user_id: row.user_id,
    full_name: user?.full_name ?? 'QuickGig worker',
    location: user?.location ?? '',
    bio: row.bio ?? '',
    skills: row.skills ?? [],
    experience: row.experience ?? '',
    transport_available: row.transport_available,
    preferred_categories: row.preferred_categories ?? [],
    rating: Number(row.rating ?? 0),
    verification_status: row.verification_status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapClientProfile(row: ClientProfileRow): ClientProfile {
  return {
    id: row.id,
    user_id: row.user_id,
    business_name: row.business_name ?? 'QuickGig client',
    business_type: row.business_type ?? '',
    description: row.description ?? '',
    rating: Number(row.rating ?? 0),
    verification_status: row.verification_status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapGig(row: GigRow, usersById: Map<string, User>, clientsByUserId: Map<string, ClientProfile>, address = ''): Gig {
  return {
    id: row.id,
    client_id: row.client_id,
    client_name: clientsByUserId.get(row.client_id)?.business_name || usersById.get(row.client_id)?.full_name || 'QuickGig client',
    title: row.title,
    description: row.description,
    category: row.category,
    location_area: row.location_area,
    // Only filled in for the gig owner and accepted workers: the database enforces this.
    address_private: address,
    date: row.date,
    start_time: row.start_time,
    end_time: row.end_time,
    pay_amount: Number(row.pay_amount),
    workers_needed: row.workers_needed,
    requirements: row.requirements ?? '',
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapApplication(row: ApplicationRow, gigsById: Map<string, Gig>, usersById: Map<string, User>): Application {
  return {
    id: row.id,
    gig_id: row.gig_id,
    gig_title: gigsById.get(row.gig_id)?.title ?? 'QuickGig SA gig',
    worker_id: row.worker_id,
    worker_name: usersById.get(row.worker_id)?.full_name ?? 'QuickGig worker',
    message: row.message,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapReport(row: ReportRow): Report {
  return {
    id: row.id,
    reported_by: row.reported_by,
    reported_user_id: row.reported_user_id,
    gig_id: row.gig_id,
    reason: row.reason,
    description: row.description ?? '',
    status: row.status,
    created_at: row.created_at,
  };
}

function getInitialState() {
  return {
    users: mockUsers,
    workerProfiles: mockWorkerProfiles,
    clientProfiles: mockClientProfiles,
    gigs: mockGigs,
    applications: mockApplications,
    reports: mockReports,
    messages: mockMessages,
    notifications: mockNotifications,
    reviews: mockReviews,
  };
}

/** Demo-mode stand-in for the database triggers in 20260601000000_notifications.sql. */
/** Same truncation the DB triggers apply, so long names can't be used to smuggle text into notifications/emails. */
function clip(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value;
}

function demoNotification(input: Omit<Notification, 'id' | 'read_at' | 'created_at'>): Notification {
  return { ...input, id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, read_at: null, created_at: new Date().toISOString() };
}

export function PlatformStoreProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [workerProfiles, setWorkerProfiles] = useState<WorkerProfile[]>(mockWorkerProfiles);
  const [clientProfiles, setClientProfiles] = useState<ClientProfile[]>(mockClientProfiles);
  const [gigs, setGigs] = useState<Gig[]>(mockGigs);
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [emailNotifications, setEmailNotificationsState] = useState(true);
  const [loading, setLoading] = useState(true);
  const isSupabaseConnected = Boolean(supabase);

  const loadSupabaseData = useCallback(async () => {
    if (!supabase) return;

    setLoading(true);
    const [publicProfilesResult, ownUsersResult, workerProfilesResult, clientProfilesResult, gigsResult, applicationsResult, reportsResult, addressesResult, messagesResult, notificationsResult, reviewsResult] = await Promise.all([
      // Safe for everyone: names/locations only, no email or phone (see public_profiles view).
      supabase.from('public_profiles').select('*').order('created_at', { ascending: false }).limit(1000),
      // RLS-restricted: returns only the caller's own row, or every row for admins.
      supabase.from('users').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('worker_profiles').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('client_profiles').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('gigs').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('applications').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(1000),
      // Row-level security returns only addresses this user may see (own gigs, or accepted applications).
      supabase.from('gig_private_details').select('*').limit(1000),
      // RLS: only threads the caller is a party to (or all, for admins).
      supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(5000),
      // RLS: only the caller's own notifications.
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(2000),
    ]);

    const firstError = publicProfilesResult.error ?? ownUsersResult.error ?? workerProfilesResult.error ?? clientProfilesResult.error ?? gigsResult.error ?? applicationsResult.error ?? reportsResult.error ?? addressesResult.error ?? messagesResult.error ?? notificationsResult.error ?? reviewsResult.error;
    if (firstError) {
      setLoading(false);
      throw firstError;
    }

    const publicProfileRows = (publicProfilesResult.data ?? []) as PublicProfileRow[];
    const ownUserRows = (ownUsersResult.data ?? []) as UserRow[];
    const workerProfileRows = (workerProfilesResult.data ?? []) as WorkerProfileRow[];
    const clientProfileRows = (clientProfilesResult.data ?? []) as ClientProfileRow[];
    const gigRows = (gigsResult.data ?? []) as GigRow[];
    const applicationRows = (applicationsResult.data ?? []) as ApplicationRow[];
    const reportRows = (reportsResult.data ?? []) as ReportRow[];

    const mappedUsers = mergeUsers(publicProfileRows, ownUserRows);
    const usersById = new Map(mappedUsers.map((user) => [user.id, user]));
    const mappedClientProfiles = clientProfileRows.map(mapClientProfile);
    const clientsByUserId = new Map(mappedClientProfiles.map((profile) => [profile.user_id, profile]));
    const mappedWorkerProfiles = workerProfileRows.map((profile) => mapWorkerProfile(profile, usersById));
    const addressesByGigId = new Map(((addressesResult.data ?? []) as { gig_id: string; address: string }[]).map((row) => [row.gig_id, row.address] as const));
    const mappedGigs = gigRows.map((gig) => mapGig(gig, usersById, clientsByUserId, addressesByGigId.get(gig.id) ?? ''));
    const gigsById = new Map(mappedGigs.map((gig) => [gig.id, gig]));
    const mappedApplications = applicationRows.map((application) => mapApplication(application, gigsById, usersById));
    const mappedReports = reportRows.map(mapReport);

    setUsers(mappedUsers);
    setWorkerProfiles(mappedWorkerProfiles);
    setClientProfiles(mappedClientProfiles);
    setGigs(mappedGigs);
    setApplications(mappedApplications);
    setReports(mappedReports);
    setMessages((messagesResult.data ?? []) as MessageRow[]);
    setNotifications(((notificationsResult.data ?? []) as NotificationRow[]).map(({ emailed_at: _emailed, ...row }) => row));
    setReviews(((reviewsResult.data ?? []) as ReviewRow[]).map((row) => ({ ...row, comment: row.comment ?? '' })));
    // `users` is RLS-restricted to the caller's own row (admins see all; theirs is matched by auth id below).
    const { data: authData } = await supabase.auth.getUser();
    const me = ownUserRows.find((row) => row.id === authData.user?.id);
    if (me && typeof me.email_notifications === 'boolean') setEmailNotificationsState(me.email_notifications);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (supabase) {
      // Initial load from Supabase / localStorage (external stores), then subscribe to auth changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadSupabaseData().catch(() => setLoading(false));
      const { data } = supabase.auth.onAuthStateChange(() => {
        loadSupabaseData().catch(() => setLoading(false));
      });

      return () => {
        data.subscription.unsubscribe();
      };
    }

    try {
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(STORE_KEY);
      } catch {
        stored = null;
      }
      if (stored) {
        const parsed = JSON.parse(stored) as { gigs?: Gig[]; applications?: Application[]; reports?: Report[]; messages?: Message[]; notifications?: Notification[]; reviews?: Review[]; emailNotifications?: boolean };
        setGigs(parsed.gigs?.length ? parsed.gigs : mockGigs);
        setApplications(parsed.applications?.length ? parsed.applications : mockApplications);
        setReports(parsed.reports?.length ? parsed.reports : mockReports);
        setMessages(parsed.messages ?? mockMessages);
        setReviews(parsed.reviews ?? mockReviews);
        setNotifications(parsed.notifications ?? mockNotifications);
        if (typeof parsed.emailNotifications === 'boolean') setEmailNotificationsState(parsed.emailNotifications);
      }
    } finally {
      setLoading(false);
    }
  }, [loadSupabaseData]);

  useEffect(() => {
    if (!supabase && !loading) {
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify({ gigs, applications, reports, messages, notifications, reviews, emailNotifications }));
      } catch (error) {
        // Safari private mode / storage full: keep working in memory for this session.
        console.warn('[store] Could not persist demo data:', error);
      }
    }
  }, [applications, emailNotifications, gigs, loading, messages, notifications, reports, reviews]);

  const createGig = useCallback(
    async (data: CreateGigInput) => {
      if (supabase) {
        const { data: createdGig, error } = await supabase
          .from('gigs')
          .insert([
            {
              client_id: data.client_id,
              title: data.title,
              description: data.description,
              category: data.category,
              location_area: data.location_area,
              date: data.date,
              start_time: data.start_time,
              end_time: data.end_time,
              pay_amount: data.pay_amount,
              workers_needed: data.workers_needed,
              requirements: data.requirements,
              status: 'open',
            },
          ])
          .select('*')
          .single();

        if (error) throw error;

        // The private address lives in its own table so only the owner and accepted workers can read it.
        const { error: addressError } = await supabase
          .from('gig_private_details')
          .insert([{ gig_id: createdGig.id, address: data.address_private }]);
        if (addressError) {
          // Clients cannot delete gigs (no delete policy), so cancel it rather than leave an open gig without an address.
          await supabase.from('gigs').update({ status: 'cancelled' }).eq('id', createdGig.id);
          throw addressError;
        }

        const usersById = new Map(users.map((user) => [user.id, user]));
        const clientsByUserId = new Map(clientProfiles.map((profile) => [profile.user_id, profile]));
        const gig = mapGig(createdGig, usersById, clientsByUserId, data.address_private);
        setGigs((current) => [gig, ...current]);
        return gig;
      }

      const now = new Date().toISOString();
      const clientName = mockUsers.find((user) => user.id === data.client_id)?.full_name ?? 'QuickGig client';
      const gig: Gig = {
        ...data,
        id: `gig_${Date.now()}`,
        client_name: clientName,
        status: 'open',
        created_at: now,
        updated_at: now,
      };

      setGigs((current) => [gig, ...current]);
      return gig;
    },
    [clientProfiles, users],
  );

  const applyToGig = useCallback(
    async ({ gig_id, worker_id, worker_name, message }: { gig_id: string; worker_id: string; worker_name: string; message: string }) => {
      if (supabase) {
        const { data: createdApplication, error } = await supabase
          .from('applications')
          .insert([{ gig_id, worker_id, message, status: 'pending' }])
          .select('*')
          .single();

        if (error) throw error;

        const usersById = new Map(users.map((user) => [user.id, user]));
        const gigsById = new Map(gigs.map((gig) => [gig.id, gig]));
        const application = mapApplication(createdApplication, gigsById, usersById);
        setApplications((current) => [application, ...current]);
        return application;
      }

      const gig = gigs.find((item) => item.id === gig_id);
      const now = new Date().toISOString();
      const application: Application = {
        id: `app_${Date.now()}`,
        gig_id,
        gig_title: gig?.title ?? 'QuickGig SA gig',
        worker_id,
        worker_name,
        message,
        status: 'pending',
        created_at: now,
        updated_at: now,
      };

      setApplications((current) => [application, ...current]);
      if (gig) {
        setNotifications((current) => [
          demoNotification({
            user_id: gig.client_id,
            type: 'new_application',
            title: `New applicant: ${clip(worker_name, 60)}`,
            body: `${clip(worker_name, 60)} applied to "${clip(gig.title, 80)}".`,
            link: `/client/gigs/${gig.id}/applications`,
            application_id: application.id,
          }),
          ...current,
        ]);
      }
      return application;
    },
    [gigs, users],
  );

  const updateApplicationStatus = useCallback(async (id: string, status: ApplicationStatus) => {
    if (supabase) {
      const { error } = await supabase.from('applications').update({ status }).eq('id', id);
      if (error) throw error;
    }

    setApplications((current) =>
      current.map((application) =>
        application.id === id ? { ...application, status, updated_at: new Date().toISOString() } : application,
      ),
    );

    if (!supabase && (status === 'accepted' || status === 'rejected')) {
      const application = applications.find((item) => item.id === id);
      const gig = application ? gigs.find((item) => item.id === application.gig_id) : undefined;
      if (application && gig) {
        const type = status === 'accepted' ? 'application_accepted' : 'application_rejected';
        setNotifications((current) => {
          // Mirrors the DB unique index: each decision is notified at most once per application,
          // so a client flipping accept/reject cannot spam the worker.
          if (current.some((note) => note.application_id === application.id && note.type === type)) return current;
          return [
          status === 'accepted'
            ? demoNotification({
                user_id: application.worker_id,
                type: 'application_accepted',
                title: `You got the gig: ${clip(gig.title, 80)}`,
                body: `${clip(gig.client_name, 60)} accepted your application. Say hello and confirm the details.`,
                link: `/messages/${application.id}`,
                application_id: application.id,
              })
            : demoNotification({
                user_id: application.worker_id,
                type: 'application_rejected',
                title: `Update on ${clip(gig.title, 80)}`,
                body: 'The client went with someone else this time. More gigs are posted every week.',
                link: '/browse',
                application_id: application.id,
              }),
          ...current,
          ];
        });
      }
    }
  }, [applications, gigs]);

  const createReport = useCallback(async (data: CreateReportInput) => {
    if (supabase) {
      const { data: createdReport, error } = await supabase
        .from('reports')
        .insert([
          {
            reported_by: data.reported_by,
            reported_user_id: data.reported_user_id,
            gig_id: data.gig_id,
            reason: data.reason,
            description: data.description,
            status: 'open',
          },
        ])
        .select('*')
        .single();

      if (error) throw error;

      const report = mapReport(createdReport);
      setReports((current) => [report, ...current]);
      return report;
    }

    const report: Report = {
      ...data,
      id: `report_${Date.now()}`,
      status: 'open',
      created_at: new Date().toISOString(),
    };

    setReports((current) => [report, ...current]);
    return report;
  }, []);

  const updateGigStatus = useCallback(async (id: string, status: GigStatus) => {
    if (supabase) {
      const { error } = await supabase.from('gigs').update({ status }).eq('id', id);
      if (error) throw error;
    }

    setGigs((current) => current.map((gig) => (gig.id === id ? { ...gig, status, updated_at: new Date().toISOString() } : gig)));
  }, []);

  const updateGig = useCallback(
    async (id: string, data: UpdateGigInput) => {
      const existing = gigs.find((gig) => gig.id === id);
      if (!existing) throw new Error('This gig no longer exists.');
      if (existing.status === 'completed' || existing.status === 'cancelled') throw new Error('Completed or cancelled gigs cannot be edited.');
      const { address_private, ...fields } = data;

      if (supabase) {
        const { error } = await supabase.from('gigs').update(fields).eq('id', id);
        if (error) throw error;
        if (address_private !== existing.address_private) {
          const { error: addressError } = await supabase.from('gig_private_details').upsert({ gig_id: id, address: address_private }, { onConflict: 'gig_id' });
          if (addressError) throw addressError;
        }
        setGigs((current) => current.map((gig) => (gig.id === id ? { ...gig, ...data, updated_at: new Date().toISOString() } : gig)));
        return;
      }

      setGigs((current) => current.map((gig) => (gig.id === id ? { ...gig, ...data, updated_at: new Date().toISOString() } : gig)));

      // Mirror the DB triggers: tell pending/accepted applicants about changes that affect them.
      const changes: string[] = [];
      if (data.date !== existing.date) changes.push(`date is now ${data.date}`);
      if (data.start_time !== existing.start_time || data.end_time !== existing.end_time) changes.push(`time is now ${data.start_time}–${data.end_time}`);
      if (data.location_area !== existing.location_area) changes.push(`area is now ${clip(data.location_area, 60)}`);
      if (data.pay_amount !== existing.pay_amount) changes.push(`pay is now R${data.pay_amount}`);
      if (data.title !== existing.title) changes.push(`title is now "${clip(data.title, 80)}"`);
      const addressChanged = address_private !== existing.address_private;
      if (!changes.length && !addressChanged) return;

      const affected = applications.filter((application) => application.gig_id === id && (application.status === 'pending' || application.status === 'accepted'));
      const fresh = affected.flatMap((application) => {
        const notes: Notification[] = [];
        if (changes.length) {
          notes.push(
            demoNotification({
              user_id: application.worker_id,
              type: 'gig_updated',
              title: `Gig updated: ${clip(data.title, 80)}`,
              body: clip(`The ${changes.join('; the ')}.`, 300),
              link: `/gigs/${id}`,
              application_id: application.id,
            }),
          );
        }
        if (addressChanged && application.status === 'accepted') {
          notes.push(
            demoNotification({
              user_id: application.worker_id,
              type: 'gig_updated',
              title: `Address changed: ${clip(data.title, 80)}`,
              body: 'The client updated the private address. Open the gig to see the new one.',
              link: `/gigs/${id}`,
              application_id: application.id,
            }),
          );
        }
        return notes;
      });
      if (fresh.length) setNotifications((current) => [...fresh, ...current]);
    },
    [applications, gigs],
  );

  const updateVerificationStatus = useCallback(async (profileType: 'worker' | 'client', profileId: string, status: VerificationStatus) => {
    if (supabase) {
      const table = profileType === 'worker' ? 'worker_profiles' : 'client_profiles';
      const { error } = await supabase.from(table).update({ verification_status: status }).eq('id', profileId);
      if (error) throw error;
    }

    if (profileType === 'worker') {
      setWorkerProfiles((current) => current.map((profile) => (profile.id === profileId ? { ...profile, verification_status: status, updated_at: new Date().toISOString() } : profile)));
      return;
    }

    setClientProfiles((current) => current.map((profile) => (profile.id === profileId ? { ...profile, verification_status: status, updated_at: new Date().toISOString() } : profile)));
  }, []);

  const updateReportStatus = useCallback(async (id: string, status: ReportStatus) => {
    if (supabase) {
      const { error } = await supabase.from('reports').update({ status }).eq('id', id);
      if (error) throw error;
    }

    setReports((current) => current.map((report) => (report.id === id ? { ...report, status } : report)));
  }, []);

  const updateWorkerProfile = useCallback(
    async (userId: string, data: Partial<Pick<WorkerProfile, 'bio' | 'skills' | 'experience' | 'transport_available' | 'preferred_categories'>>) => {
      if (supabase) {
        const { error } = await supabase.from('worker_profiles').update(data).eq('user_id', userId);
        if (error) throw error;
      }

      setWorkerProfiles((current) => current.map((profile) => (profile.user_id === userId ? { ...profile, ...data, updated_at: new Date().toISOString() } : profile)));
    },
    [],
  );

  const updateClientProfile = useCallback(
    async (userId: string, data: Partial<Pick<ClientProfile, 'business_name' | 'business_type' | 'description'>>) => {
      if (supabase) {
        const { error } = await supabase.from('client_profiles').update(data).eq('user_id', userId);
        if (error) throw error;
      }

      setClientProfiles((current) => current.map((profile) => (profile.user_id === userId ? { ...profile, ...data, updated_at: new Date().toISOString() } : profile)));
    },
    [],
  );

  const sendMessage = useCallback(
    async ({ application_id, sender_id, body }: { application_id: string; sender_id: string; body: string }) => {
      const trimmed = body.trim();
      if (!trimmed) throw new Error('Write a message first.');
      if (trimmed.length > 2000) throw new Error('Messages are limited to 2000 characters.');

      if (supabase) {
        const { data, error } = await supabase.from('messages').insert([{ application_id, sender_id, body: trimmed }]).select('*').single();
        if (error) throw error;
        const message = data as MessageRow;
        setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
        return message;
      }

      const application = applications.find((item) => item.id === application_id);
      if (!application) throw new Error('This conversation no longer exists.');
      if (application.status !== 'accepted' && application.status !== 'completed') {
        throw new Error('Messaging opens once the application is accepted.');
      }
      const gig = gigs.find((item) => item.id === application.gig_id);
      if (sender_id !== application.worker_id && sender_id !== gig?.client_id) {
        throw new Error('Only the client and the accepted worker can message here.');
      }

      const message: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        application_id,
        sender_id,
        body: trimmed,
        created_at: new Date().toISOString(),
        read_at: null,
      };
      setMessages((current) => [...current, message]);
      const recipient = sender_id === application.worker_id ? gig?.client_id : application.worker_id;
      const senderName = sender_id === application.worker_id ? application.worker_name : gig?.client_name ?? 'QuickGig user';
      if (recipient) {
        setNotifications((current) => [
          demoNotification({
            user_id: recipient,
            type: 'new_message',
            title: `Message from ${clip(senderName, 60)}`,
            body: trimmed.length > 140 ? `${trimmed.slice(0, 140)}…` : trimmed,
            link: `/messages/${application_id}`,
            application_id,
          }),
          ...current,
        ]);
      }
      return message;
    },
    [applications, gigs],
  );

  const markThreadRead = useCallback(
    async (application_id: string, reader_id: string) => {
      const unreadIds = messages.filter((m) => m.application_id === application_id && m.sender_id !== reader_id && !m.read_at).map((m) => m.id);
      if (!unreadIds.length) return;
      const now = new Date().toISOString();

      if (supabase) {
        const { error } = await supabase.from('messages').update({ read_at: now }).in('id', unreadIds);
        if (error) throw error;
      }

      setMessages((current) => current.map((m) => (unreadIds.includes(m.id) ? { ...m, read_at: now } : m)));
    },
    [messages],
  );

  const markNotificationsRead = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    const now = new Date().toISOString();
    if (supabase) {
      const { error } = await supabase.from('notifications').update({ read_at: now }).in('id', ids);
      if (error) throw error;
    }
    setNotifications((current) => current.map((note) => (ids.includes(note.id) && !note.read_at ? { ...note, read_at: now } : note)));
  }, []);

  const setEmailNotifications = useCallback(async (userId: string, enabled: boolean) => {
    if (supabase) {
      const { error } = await supabase.from('users').update({ email_notifications: enabled }).eq('id', userId);
      if (error) throw error;
    }
    setEmailNotificationsState(enabled);
  }, []);

  const addReview = useCallback(
    async ({ gig_id, reviewer_id, reviewed_user_id, rating, comment }: CreateReviewInput) => {
      const trimmed = comment.trim();
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Pick a rating from 1 to 5 stars.');
      if (trimmed.length > 600) throw new Error('Keep the review under 600 characters.');

      if (supabase) {
        const { data, error } = await supabase
          .from('reviews')
          .insert([{ gig_id, reviewer_id, reviewed_user_id, rating, comment: trimmed || null }])
          .select('*')
          .single();
        if (error) throw error;
        const row = data as ReviewRow;
        const review: Review = { ...row, comment: row.comment ?? '' };
        setReviews((current) => [review, ...current]);
        // The DB trigger recomputed the stored rating; refresh so profiles show it.
        loadSupabaseData().catch(() => undefined);
        return review;
      }

      if (reviews.some((item) => item.gig_id === gig_id && item.reviewer_id === reviewer_id && item.reviewed_user_id === reviewed_user_id)) {
        throw new Error('You have already reviewed this person for this gig.');
      }
      const review: Review = { id: `review_${Date.now()}`, gig_id, reviewer_id, reviewed_user_id, rating, comment: trimmed, created_at: new Date().toISOString() };
      const next = [review, ...reviews];
      setReviews(next);

      // Mirror the DB trigger: recompute the stored average and notify the reviewed person.
      const theirs = next.filter((item) => item.reviewed_user_id === reviewed_user_id);
      const average = Math.round((theirs.reduce((sum, item) => sum + item.rating, 0) / theirs.length) * 100) / 100;
      setWorkerProfiles((current) => current.map((profile) => (profile.user_id === reviewed_user_id ? { ...profile, rating: average } : profile)));
      setClientProfiles((current) => current.map((profile) => (profile.user_id === reviewed_user_id ? { ...profile, rating: average } : profile)));
      const gig = gigs.find((item) => item.id === gig_id);
      const reviewer = users.find((item) => item.id === reviewer_id);
      const reviewerName = clip(gig && gig.client_id === reviewer_id ? gig.client_name : (reviewer?.full_name ?? 'a QuickGig user'), 60);
      const isWorker = workerProfiles.some((profile) => profile.user_id === reviewed_user_id);
      setNotifications((current) => [
        demoNotification({
          user_id: reviewed_user_id,
          type: 'new_review',
          title: `New ${rating}-star review from ${reviewerName}`,
          body: trimmed ? clip(trimmed, 140) : `They rated you ${rating} out of 5 for "${clip(gig?.title ?? 'a gig', 80)}".`,
          link: isWorker ? '/worker/profile' : '/client/profile',
          application_id: null,
        }),
        ...current,
      ]);
      return review;
    },
    [gigs, loadSupabaseData, reviews, users, workerProfiles],
  );

  const resetDemoData = useCallback(() => {
    if (supabase) {
      loadSupabaseData().catch(() => undefined);
      return;
    }

    const initialState = getInitialState();
    setUsers(initialState.users);
    setWorkerProfiles(initialState.workerProfiles);
    setClientProfiles(initialState.clientProfiles);
    setGigs(initialState.gigs);
    setApplications(initialState.applications);
    setReports(initialState.reports);
    setMessages(initialState.messages);
    setNotifications(initialState.notifications);
    setReviews(initialState.reviews);
    setEmailNotificationsState(true);
    try {
      window.localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
  }, [loadSupabaseData]);

  const value = useMemo(
    () => ({
      users,
      workerProfiles,
      clientProfiles,
      gigs,
      applications,
      reports,
      messages,
      notifications,
      reviews,
      addReview,
      emailNotifications,
      loading,
      isSupabaseConnected,
      createGig,
      applyToGig,
      createReport,
      sendMessage,
      markThreadRead,
      markNotificationsRead,
      setEmailNotifications,
      updateApplicationStatus,
      updateGigStatus,
      updateGig,
      updateVerificationStatus,
      updateReportStatus,
      updateWorkerProfile,
      updateClientProfile,
      resetDemoData,
    }),
    [
      applications,
      applyToGig,
      addReview,
      reviews,
      messages,
      notifications,
      emailNotifications,
      sendMessage,
      markThreadRead,
      markNotificationsRead,
      setEmailNotifications,
      clientProfiles,
      createGig,
      createReport,
      gigs,
      reports,
      isSupabaseConnected,
      loading,
      resetDemoData,
      updateApplicationStatus,
      updateClientProfile,
      updateGig,
      updateGigStatus,
      updateReportStatus,
      updateVerificationStatus,
      updateWorkerProfile,
      users,
      workerProfiles,
    ],
  );

  return <PlatformStoreContext.Provider value={value}>{children}</PlatformStoreContext.Provider>;
}

export function usePlatformStore() {
  const context = useContext(PlatformStoreContext);
  if (!context) {
    throw new Error('usePlatformStore must be used within PlatformStoreProvider');
  }
  return context;
}
