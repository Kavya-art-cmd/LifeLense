FROM node:22-alpine 
WORKDIR /app 
COPY . . 
RUN find . -name package.json -exec sed -i 's/"catalog:"/"*"/g' {} + && find . -name package.json -exec sed -i 's/"workspace:\*"/"*"/g' {} + 
RUN sed -i '/preinstall/d' package.json 
RUN rm -f pnpm-workspace.yaml pnpm-lock.yaml .npmrc 
WORKDIR /app/lib/db 
RUN npm install --legacy-peer-deps 
WORKDIR /app/artifacts/api-server 
RUN npm install --legacy-peer-deps 
RUN npm install -g tsx 
EXPOSE 3000 
CMD ["tsx", "src/index.ts"]
