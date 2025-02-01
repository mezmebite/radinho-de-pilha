FROM nvidia/cuda:12.2.0-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    nodejs \
    npm \
    ffmpeg \
    libavcodec-extra \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia apenas o package.json primeiro
COPY frontend/package.json ./frontend/

# Instala dependências e gera package-lock.json
RUN cd frontend && npm install

# Copia o restante dos arquivos
COPY frontend ./frontend

# Executa o build
RUN cd frontend && npm run build

COPY . .

EXPOSE 7860
EXPOSE 3000

CMD sh -c "uvicorn app:app --host 0.0.0.0 --port 7860 --client-max-body-size 50M & cd frontend && npm run start"
