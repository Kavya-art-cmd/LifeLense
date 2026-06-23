FROM node:22-alpine 
RUN npm install -g pnpm 
WORKDIR /app 
COPY . . 
RUN rm -f pnpm-workspace.yaml 
RUN pnpm install --no-frozen-lockfile 
RUN pnpm --filter @workspace/api-server... build 
EXPOSE 3000 
CMD ["pnpm", "--filter", "@workspace/api-server", "start"]
