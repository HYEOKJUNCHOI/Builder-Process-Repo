import { QueryClient } from '@tanstack/react-query';

// TanStack React Query 클라이언트 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,               // 실패 시 1번만 재시도
      staleTime: 1000 * 30,   // 30초간 fresh 상태 유지
      refetchOnWindowFocus: false,
    },
  },
});

export default queryClient;
