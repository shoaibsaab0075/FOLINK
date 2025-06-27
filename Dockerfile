# =================================================================
# 1. 빌드 스테이지 (Builder Stage)
# - 소스 코드를 실행 가능한 파일로 빌드(컴파일)하는 역할만 담당합니다.
# - 개발에 필요한 도구들을 포함하며, 최종 이미지 크기를 줄이기 위해 분리합니다.
# =================================================================

# Node.js 20 버전의 가벼운 alpine 이미지를 베이스로 사용하고, 이 스테이지의 이름을 'builder'로 지정합니다.
FROM node:20-alpine AS builder

RUN mkdir -p /app
# 컨테이너 내부에 /app 이라는 작업 디렉토리를 생성하고, 이후 모든 명령어가 실행될 위치로 지정합니다.
WORKDIR /app

# 로컬의 package.json과 package-lock.json 파일을 컨테이너의 /app 디렉토리로 복사합니다.
# (이것을 먼저 하는 이유는 도커의 캐싱 기능을 활용해 의존성 설치 단계를 가속화하기 위함입니다.)
COPY package*.json ./

# package.json에 명시된 모든 프로젝트 의존성(node_modules)을 설치합니다.
# --legacy-peer-deps 옵션은 일부 버전 충돌 문제를 자동으로 해결해줍니다.
RUN npm install --legacy-peer-deps

# 현재 디렉토리(로컬 프로젝트)의 모든 파일을 컨테이너의 /app 디렉토리로 복사합니다.
COPY . .

# 'npm run build' 스크립트를 실행하여 TypeScript 코드를 JavaScript로 컴파일합니다.
# 컴파일 결과는 보통 /app/dist 폴더에 생성됩니다.
RUN npm run build


# =================================================================
# 2. 런타임 스테이지 (Runtime Stage)
# - 빌드된 결과물만 가져와 실제 애플리케이션을 실행하는 역할만 담당합니다.
# - 개발 도구나 소스 코드 없이 실행에 필요한 최소한의 파일만 포함하여 이미지를 매우 가볍게 만듭니다.
# =================================================================

# 다시 깨끗하고 가벼운 node:20-alpine 이미지에서 새로운 스테이지를 시작합니다.
FROM node:20-alpine

RUN mkdir -p /app
# 런타임 환경에서도 동일하게 /app 디렉토리를 작업 공간으로 설정합니다.
WORKDIR /app

# [보안 강화] 컨테이너를 root 권한이 아닌 일반 사용자 권한으로 실행하기 위해 새로운 그룹과 사용자를 생성합니다.
RUN addgroup --system --gid 1001 nodejs && \
   adduser --system --uid 1001 nodejs && \
   chown nodejs:nodejs /app

# [보안 강화] 이후의 모든 명령어는 위에서 생성한 'nodejs' 사용자의 권한으로 실행됩니다.
USER nodejs

# '--from=builder' 옵션을 사용해 'builder' 스테이지에서 '/app/node_modules'를 복사해옵니다.
# '--chown' 옵션으로 파일 소유자를 'nodejs' 사용자로 지정합니다.
COPY --chown=nodejs:nodejs --from=builder /app/node_modules ./node_modules

# 'builder' 스테이지에서 'package.json' 관련 파일들을 복사해옵니다. (런타임에 필요할 수 있음)
COPY --chown=nodejs:nodejs --from=builder /app/package*.json ./

# 'builder' 스테이지에서 컴파일된 결과물인 'dist' 폴더를 통째로 복사해옵니다.
COPY --chown=nodejs:nodejs --from=builder /app/dist ./dist

# 환경변수 NODE_ENV를 'production'(운영 환경)으로 설정하여 앱 성능을 최적화합니다.
ENV NODE_ENV=production

# 이 컨테이너는 3000번 포트를 사용(리스닝)할 것임을 명시적으로 알립니다. (실제 포트 개방은 아님)
EXPOSE 3000

# 컨테이너가 시작될 때 최종적으로 실행할 명령어를 정의합니다. (컴파일된 main.js 파일을 node로 실행)
CMD ["node", "dist/main.js"]