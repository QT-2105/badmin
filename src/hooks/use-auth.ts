import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';

import {
  bootstrapOwner,
  createAuthUser,
  fetchBootstrapStatus,
  fetchAuthUsers,
  fetchCurrentUser,
  fetchRolePermissions,
  login,
  logout,
  updateAuthUser,
  updateRolePermissions
} from '@/services/auth-service';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: ({ signal }) => fetchCurrentUser(signal),
    staleTime: 60_000,
    retry: false
  });
}

export function useBootstrapStatus() {
  return useQuery({
    queryKey: ['auth', 'bootstrap'],
    queryFn: ({ signal }) => fetchBootstrapStatus(signal),
    staleTime: 30_000,
    retry: false
  });
}

export function useBootstrapOwnerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bootstrapOwner,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
    }
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
    }
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.clear();
      router.push('/login' as Route);
      router.refresh();
    }
  });
}

export function useAuthUsers() {
  return useQuery({
    queryKey: ['auth', 'users'],
    queryFn: ({ signal }) => fetchAuthUsers(signal)
  });
}

export function useAuthUserMutations() {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['auth', 'users'] });
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
  return useQuery({
    queryKey: ['auth', 'role-permissions'],
    queryFn: ({ signal }) => fetchRolePermissions(signal)
  });
}

export function useRolePermissionMutations() {
  const queryClient = useQueryClient();
  return {
    updateRolePermissions: useMutation({
      mutationFn: updateRolePermissions,
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['auth', 'role-permissions'] }),
          queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        ]);
      }
    })
  };
}
