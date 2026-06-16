# 예시 Dockerfile 구조 점검
FROM node:22.2.0

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install

COPY . .
# 1. 빌드 아규먼트로 넘어온 환경변수 처리 및 프로덕션 빌드 스텝이 필수적입니다.
RUN yarn build 

EXPOSE 5173
CMD ["yarn", "run", "preview", "--host", "0.0.0.0", "--port", "5173"]