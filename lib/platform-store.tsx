'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type Application,
  type ApplicationStatus,
  type ClientProfile,
  type Gig,
  type GigStatus,
  type Report,
  type ReportStatus,
  type User,
  type VerificationStatus,
  type WorkerProfile,
  mockApplications,
  mockClientProfiles,
  mockGigs,
  mockReports,
  mockUsers,
  mockWorkerProfiles,
} from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type CreateGigInput = Omit<Gig, 'id' | 'client_name' | 'status' | 'created_at' | 'updated_at'>;
type CreateReportInput = Pick<Report, 'reported_by' | 'reported_user_id' | 'gig_id' | 'reason' | 'description'>;
type GigRow = Database['public']['Tables']['gigs']['Row'];
type ApplicationRow = Database['public']['Tables']['applications']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type WorkerProfileRow = Database['public']['Tables']['worker_profiles']['Row'];
type ClientProfileRow = Database['public']['Tables']['client_profiles']['Row'];
type ReportRow = Database['public']['Tables']['reports']['Row'];
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
  loading: boolean;
  isSupabaseConnected: boolean;
  createGig: (data: CreateGigInput) => Promise<Gig>;
  applyToGig: (data: { gig_id: string; worker_id: string; worker_name: string; message: string }) => Promise<Application>;
  createReport: (data: CreateReportInput) => Promise<Report>;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => Promise<void>;
  updateGigStatus: (id: string, status: GigStatus) => Promise<void>;
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

function mapGig(row: GigRow, usersById: Map<string, User>, clientsByUserId: Map<string, ClientProfile>): Gig {
  return {
    id: row.id,
    client_id: row.client_id,
    client_name: clientsByUserId.get(row.client_id)?.business_name || usersById.get(row.client_id)?.full_name || 'QuickGig client',
    title: row.title,
    description: row.description,
    category: row.category,
    location_area: row.location_area,
    address_private: row.address_private ?? '',
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
  };
}

export function PlatformStoreProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [workerProfiles, setWorkerProfiles] = useState<WorkerProfile[]>(mockWorkerProfiles);
  const [clientProfiles, setClientProfiles] = useState<ClientProfile[]>(mockClientProfiles);
  const [gigs, setGigs] = useState<Gig[]>(mockGigs);
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [loading, setLoading] = useState(true);
  const isSupabaseConnected = Boolean(supabase);

  const loadSupabaseData = useCallback(async () => {
    if (!supabase) return;

    setLoading(true);
    const [publicProfilesResult, ownUsersResult, workerProfilesResult, clientProfilesResult, gigsResult, applicationsResult, reportsResult] = await Promise.all([
      // Safe for everyone: names/locations only, no email or phone (see public_profiles view).
      supabase.from('public_profiles').select('*').order('created_at', { ascending: false }).limit(1000),
      // RLS-restricted: returns only the caller's own row, or every row for admins.
      supabase.from('users').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('worker_profiles').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('client_profiles').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('gigs').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('applications').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(1000),
    ]);

    const firstError = publicProfilesResult.error ?? ownUsersResult.error ?? workerProfilesResult.error ?? clientProfilesResult.error ?? gigsResult.error ?? applicationsResult.error ?? reportsResult.error;
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
    const mappedGigs = gigRows.map((gig) => mapGig(gig, usersById, clientsByUserId));
    const gigsById = new Map(mappedGigs.map((gig) => [gig.id, gig]));
    const mappedApplications = applicationRows.map((application) => mapApplication(application, gigsById, usersById));
    const mappedReports = reportRows.map(mapReport);

    setUsers(mappedUsers);
    setWorkerProfiles(mappedWorkerProfiles);
    setClientProfiles(mappedClientProfiles);
    setGigs(mappedGigs);
    setApplications(mappedApplications);
    setReports(mappedReports);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (supabase) {
      loadSupabaseData().catch(() => setLoading(false));
      const { data } = supabase.auth.onAuthStateChange(() => {
        loadSupabaseData().catch(() => setLoading(false));
      });

      return () => {
        data.subscription.unsubscribe();
      };
    }

    try {
      const stored = window.localStorage.getItem(STORE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { gigs?: Gig[]; applications?: Application[]; reports?: Report[] };
        setGigs(parsed.gigs?.length ? parsed.gigs : mockGigs);
        setApplications(parsed.applications?.length ? parsed.applications : mockApplications);
        setReports(parsed.reports?.length ? parsed.reports : mockReports);
      }
    } finally {
      setLoading(false);
    }
  }, [loadSupabaseData]);

  useEffect(() => {
    if (!supabase && !loading) {
      window.localStorage.setItem(STORE_KEY, JSON.stringify({ gigs, applications, reports }));
    }
  }, [applications, gigs, loading, reports]);

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
              address_private: data.address_private,
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

        const usersById = new Map(users.map((user) => [user.id, user]));
        const clientsByUserId = new Map(clientProfiles.map((profile) => [profile.user_id, profile]));
        const gig = mapGig(createdGig, usersById, clientsByUserId);
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
  }, []);

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
    window.localStorage.removeItem(STORE_KEY);
  }, [loadSupabaseData]);

  const value = useMemo(
    () => ({
      users,
      workerProfiles,
      clientProfiles,
      gigs,
      applications,
      reports,
      loading,
      isSupabaseConnected,
      createGig,
      applyToGig,
      createReport,
      updateApplicationStatus,
      updateGigStatus,
      updateVerificationStatus,
      updateReportStatus,
      updateWorkerProfile,
      updateClientProfile,
      resetDemoData,
    }),
    [
      applications,
      applyToGig,
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
