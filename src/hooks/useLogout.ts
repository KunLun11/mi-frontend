import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { logout } from "@/api/auth";
import { useAuthStore } from "@/store/auth";

export function useLogout() {
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clear = useAuthStore((state) => state.clear);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        try {
          await logout(refreshToken);
        } catch {
          // Сервер недоступен — локальную сессию всё равно завершаем.
        }
      }
    },
    onSettled: () => {
      clear();
      queryClient.clear();
      navigate("/", { replace: true });
    },
  });
}
