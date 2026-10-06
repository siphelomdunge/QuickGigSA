import { supabase } from './supabase';
import type { ApplicationStatus, GigStatus } from './mock-data';
import type { Database } from './database.types';

type GigInsert = Database['public']['Tables']['gigs']['Insert'];
type WorkerProfileUpdate = Database['public']['Tables']['worker_profiles']['Update'];
type ClientProfileUpdate = Database['public']['Tables']['client_profiles']['Update'];

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return supabase;
}

export async function fetchGigs() {
  return ensureSupabase().from('gigs').select('*').order('created_at', { ascending: false });
}

export async function fetchGigById(id: string) {
  return ensureSupabase().from('gigs').select('*').eq('id', id).single();
}

export async function createGig(data: GigInsert) {
  return ensureSupabase()
    .from('gigs')
    .insert([{ ...data, status: data.status ?? 'open' }])
    .select('*')
    .single();
}

export async function fetchApplicationsByGig(gigId: string) {
  return ensureSupabase().from('applications').select('*').eq('gig_id', gigId).order('created_at', { ascending: false });
}

export async function fetchApplicationsByWorker(workerId: string) {
  return ensureSupabase().from('applications').select('*').eq('worker_id', workerId).order('created_at', { ascending: false });
}

export async function createApplication(data: { gig_id: string; worker_id: string; message: string }) {
  return ensureSupabase()
    .from('applications')
    .insert([{ ...data, status: 'pending' }])
    .select('*')
    .single();
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
  return ensureSupabase().from('applications').update({ status }).eq('id', id).select('*').single();
}

export async function updateGigStatus(id: string, status: GigStatus) {
  return ensureSupabase().from('gigs').update({ status }).eq('id', id).select('*').single();
}

export async function fetchUserProfile(userId: string) {
  return ensureSupabase().from('users').select('*').eq('id', userId).single();
}

export async function updateWorkerProfile(userId: string, data: WorkerProfileUpdate) {
  return ensureSupabase().from('worker_profiles').update(data).eq('user_id', userId).select('*').single();
}

export async function updateClientProfile(userId: string, data: ClientProfileUpdate) {
  return ensureSupabase().from('client_profiles').update(data).eq('user_id', userId).select('*').single();
}
