import axios from "axios";

// baseURL 결정 규칙:
//  - VITE_API_BASE_URL 이 있으면 그 값 사용 (예: https://api.example.com  ← 백엔드 HTTPS)
//  - 없으면 "" → 동일 출처. 이때 /api/* 요청은 vercel.json 의 rewrite 가 백엔드로 프록시합니다.
//  - 로컬 개발은 .env.local 에 VITE_API_BASE_URL=http://127.0.0.1:5000 을 넣어 쓰세요.
const axiosInstance = axios.create({
  baseURL: "http://168.107.42.66:5000",
  headers: {
    Accept: "*/*",
    "Content-Type": "application/json",
  },
});

// request 인터셉터: 토큰 추가 + FormData(파일 업로드) 처리
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (accessToken && refreshToken) {
      config.headers.accessToken = accessToken;
      config.headers.refreshToken = refreshToken;
    }

    // FormData(이미지/첨부 업로드)일 때는 기본 JSON Content-Type 를 제거해야
    // 브라우저가 multipart/form-data; boundary=... 를 직접 붙입니다.
    const isFormData =
      typeof FormData !== "undefined" && config.data instanceof FormData;
    if (isFormData) {
      if (config.headers && typeof config.headers.delete === "function") {
        config.headers.delete("Content-Type");
      } else if (config.headers) {
        delete config.headers["Content-Type"];
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default axiosInstance;
