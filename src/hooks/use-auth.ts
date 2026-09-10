import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';

import {
  createAuthUser,
  fetchAuthUsers,
  fetchCurrentUser,
  fetchRolePermissions,
  login,
  lookupLoginClubs,
  logout,
  updateAuthUser,
  updateRolePermissions
} from '@/services/auth-service';
import { tenantQueryKey, useTenantRoute } from '@/components/tenant/tenant-app-provider';
import { clearTenantClientState } from '@/lib/tenant-client-state';

export function useCurrentUser() {
  const { clubId } = useTenantRoute();
  return useQuery({
    queryKey: tenantQueryKey(clubId, 'auth', 'me'),
    queryFn: ({ signal }) => fetchCurrentUser(signal),
    staleTime: 60_000,
    retry: false
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clubCode, identifier, password }: { clubCode: string; identifier: string; password: string }) => login(clubCode, identifier, password),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
    }
  });
}

export function useLoginClubLookup(query: string) {
  return useQuery({
    queryKey: ['public', 'clubs', query],
    queryFn: ({ signal }) => lookupLoginClubs(query, signal),
    staleTime: 30_000,
    retry: false
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { clubId } = useTenantRoute();
  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      clearTenantClientState(clubId);
      queryClient.clear();
      router.push('/login' as Route);
      router.refresh();
    }
  });
}

export function useAuthUsers() {
  const { clubId } = useTenantRoute();
  return useQuery({
    queryKey: tenantQueryKey(clubId, 'auth', 'users'),
    queryFn: ({ signal }) => fetchAuthUsers(signal)
  });
}

export function useAuthUserMutations() {
  const { clubId } = useTenantRoute();
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'auth', 'users') });
  };

  return {
    createUser: useMutation({
      mutationFn: createAuthUser,
      onSuccess: invalidate
    }),
    updateUser: useMutation({
      mutationFn: ({ userId, payload }: { userId: string; payload: Parameters<typeof updateAuthUser>[1] }) => updateAuthUser(userId, payload),
      onSuccess: invalidate
    })
  };
}

export function useRolePermissions() {
  const { clubId } = useTenantRoute();
  return useQuery({
    queryKey: tenantQueryKey(clubId, 'auth', 'role-permissions'),
    queryFn: ({ signal }) => fetchRolePermissions(signal)
  });
}

export function useRolePermissionMutations() {
  const { clubId } = useTenantRoute();
  const queryClient = useQueryClient();
  return {
    updateRolePermissions: useMutation({
      mutationFn: updateRolePermissions,
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'auth', 'role-permissions') }),
          queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'auth', 'me') })
        ]);
      }
    })
  };
}
