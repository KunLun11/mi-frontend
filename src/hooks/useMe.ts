import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { fetchMe } from "@/api/auth";
import { useAuthStore } from "@/store/auth";

/**
 * Загружает текущего пользователя, если в сторе есть access-токен.
 * Ответ синхронизируется в `user`; 401 обрабатывает interceptor.
 */
export function useMe() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);

  const query = useQuery({
    queryKey: ["auth", "me", accessToken],
    queryFn: fetchMe,
    enabled: accessToken !== null,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  return query;
}
