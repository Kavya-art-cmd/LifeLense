FROM node:22-alpine 
WORKDIR /app 
COPY . . 
RUN sed -i 's/"catalog:"/"*"/g' package.json artifacts/*/package.json lib/*/package.json 2>nul || powershell -Command "Get-ChildItem -Filter package.json -Recurse ^| ForEach-Object { (Get-Content $_.FullName) -replace '\"catalog:\"', '\"*\"' ^| Set-Content $_.FullName }" 
RUN powershell -Command "(Get-Content package.json) -replace '\"preinstall\": \".*?\",?', '' | Set-Content package.json" 2>nul || sed -i '/preinstall/d' package.json 
RUN rm -f pnpm-workspace.yaml pnpm-lock.yaml .npmrc 
WORKDIR /app/artifacts/api-server 
RUN npm install --legacy-peer-deps 
RUN npm install -g tsx 
EXPOSE 3000 
CMD ["tsx", "src/index.ts"]
