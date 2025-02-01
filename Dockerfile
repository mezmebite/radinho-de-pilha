# Use a imagem base do CUDA 12.2
FROM nvidia/cuda:12.2.0-runtime-ubuntu22.04

# Instale Node.js 20.x (LTS) e npm
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# Instale dependências do sistema
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    ffmpeg \
    libavcodec-extra \
    git \
    && rm -rf /var/lib/apt/lists/*

# Configura o diretório de trabalho
WORKDIR /app

# Copia e instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --upgrade pip setuptools

# Copia apenas o package.json primeiro
COPY frontend/package.json ./frontend/

# Instala dependências e gera package-lock.json
RUN cd frontend && npm install

# Copia o restante dos arquivos
COPY frontend ./frontend

# Executa o build
RUN cd frontend && npm run build

# Copia o restante do código
COPY . .

# Expõe as portas
EXPOSE 7860  # Backend (FastAPI)
EXPOSE 3000  # Frontend (Next.js)

# Comando de inicialização
CMD sh -c "uvicorn app:app --host 0.0.0.0 --port 7860 --client-max-body-size 50M & cd frontend && npm run start"
