import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

const nextPageParam = (lastPage) => (lastPage.next ? new URL(lastPage.next).searchParams.get('page') : undefined)

export function useUser(username) {
  return useQuery({
    queryKey: ['user', username],
    queryFn: () => api.get(`/users/${encodeURIComponent(username)}/`).then((r) => r.data),
    retry: false,
  })
}

export function useUserPictures(username) {
  return useInfiniteQuery({
    queryKey: ['pictures', username],
    queryFn: ({ pageParam }) =>
      api.get(`/users/${encodeURIComponent(username)}/pictures/`, { params: { page: pageParam } }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
  })
}

export function useUserSearch(query) {
  return useInfiniteQuery({
    queryKey: ['userSearch', query],
    queryFn: ({ pageParam }) => api.get('/users/', { params: { search: query, page: pageParam } }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    enabled: query.length > 0,
  })
}

export function usePicture(id) {
  return useQuery({
    queryKey: ['picture', id],
    queryFn: () => api.get(`/pictures/${id}/`).then((r) => r.data),
    retry: false,
  })
}

function useInvalidateOwner() {
  const qc = useQueryClient()
  return (owner) => {
    qc.invalidateQueries({ queryKey: ['pictures', owner] })
    qc.invalidateQueries({ queryKey: ['user', owner] })
  }
}

export function useUploadPicture() {
  const invalidate = useInvalidateOwner()
  return useMutation({
    mutationFn: (formData) => api.post('/pictures/', formData).then((r) => r.data),
    onSuccess: (pic) => invalidate(pic.owner),
  })
}

export function useUpdatePicture(id) {
  const qc = useQueryClient()
  const invalidate = useInvalidateOwner()
  return useMutation({
    mutationFn: (fields) => api.patch(`/pictures/${id}/`, fields).then((r) => r.data),
    onSuccess: (pic) => {
      qc.setQueryData(['picture', id], pic)
      invalidate(pic.owner)
    },
  })
}

export function useDeletePicture(id) {
  const qc = useQueryClient()
  const invalidate = useInvalidateOwner()
  return useMutation({
    mutationFn: () => api.delete(`/pictures/${id}/`),
    onSuccess: () => {
      const pic = qc.getQueryData(['picture', id])
      qc.removeQueries({ queryKey: ['picture', id] })
      if (pic) invalidate(pic.owner)
    },
  })
}
