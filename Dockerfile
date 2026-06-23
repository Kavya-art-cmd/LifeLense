FROM node:22-alpine 
WORKDIR /app 
COPY . . 
RUN sed -i 's/"catalog:"/"*"/g' package.json artifacts/*/package.json lib/*/package.json 2>nul || powershell -Command "Get-ChildItem -Filter package.json -Recurse ^| ForEach-Object { (Get-Content $_.FullName) -replace '\"catalog:\"', '\"*\"' ^| Set-Content $_.FullName }" 
RUN powershell -Command "(Get-Content package.json) -replace '\"preinstall\": \".*?\",?', '' | Set-Content package.json" 2>nul || sed -i '/preinstall/d' package.json 
RUN rm -f pnpm-workspace.yaml pnpm-lock.yaml .npmrc 
RUN npm install --legacy-peer-deps 
RUN npm install -g ts-node tsconfig-paths typescript 
RUN ln -s /usr/local/bin/node /usr/local/bin/pnpm 
EXPOSE 3000 
CMD ["ts-node", "-r", "tsconfig-paths/register", "--transpile-only", "artifacts/api-server/src/index.ts"]
