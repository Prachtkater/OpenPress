import { useAsyncData, useFetch } from '#imports'

export function usePage(slug: string) {
  return useAsyncData(`openpress:page:${slug}`, () =>
    $fetch(`/api/_openpress/pages/${slug}`)
  )
}
