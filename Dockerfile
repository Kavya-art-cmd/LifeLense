FROM node:22-alpine 
WORKDIR /app 
COPY . . 
RUN sed -i 's/"catalog:"/"*"/g' package.json artifacts/*/package.json lib/*/package.json 2>nul || powershell -Command "Get-ChildItem -Filter package.json -Recurse ^| ForEach-Object { (Get-Content $_.FullName) -replace '\"catalog:\"', '\"*\"' ^| Set-Content $_.FullName }" 
RUN powershell -Command "(Get-Content package.json) -replace '\"preinstall\": \".*?\",?', '' | Set-Content package.json" 2>nul || sed -i '/preinstall/d' package.json 
RUN rm -f pnpm-workspace.yaml pnpm-lock.yaml .npmrc 
RUN npm install --legacy-peer-deps 
RUN npm install -g typescript 
RUN npx tsc -b artifacts/api-server/tsconfig.json 2>nul || npx tsc artifacts/api-server/src/index.ts --esModuleInterop --outDir artifacts/api-server/src/ 
EXPOSE 3000 
CMD ["node", "artifacts/api-server/src/index.js"]
