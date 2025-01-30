from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from whisper_jax import FlaxWhisperPipline
from pydub import AudioSegment
import jax.numpy as jnp
import tempfile
import os

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = FlaxWhisperPipline("openai/whisper-large-v2", dtype=jnp.bfloat16)

def convert_audio(input_path: str, output_format: str = "wav"):
    try:
        audio = AudioSegment.from_file(input_path)
        output_path = tempfile.mktemp(suffix=f".{output_format}")
        audio.export(output_path, format=output_format)
        return output_path
    except Exception as e:
        raise RuntimeError(f"Erro na conversão: {str(e)}")

@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...)):
    try:
        # Verificação de tamanho
        file.file.seek(0, 2)
        file_size = file.file.tell()
        await file.seek(0)
        
        if file_size > 50 * 1024 * 1024:
            raise HTTPException(413, "Arquivo muito grande (máximo 50MB)")

        # Salva arquivo temporário
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            content = await file.read()
            tmp.write(content)
            input_path = tmp.name

        # Conversão para formatos suportados
        if file.filename.lower().endswith(('.m4a', '.aac', '.flac')):
            input_path = convert_audio(input_path)

        # Processamento
        result = model(
            input_path,
            language="pt",
            task="transcribe",
            return_timestamps=True,
            chunk_length=30
        )

        # Limpeza
        os.unlink(input_path)

        return {
            "text": result["text"],
            "timestamps": [
                {
                    "start": chunk["timestamp"][0],
                    "end": chunk["timestamp"][1],
                    "text": chunk["text"].strip()
                } for chunk in result["chunks"]
            ]
        }

    except Exception as e:
        raise HTTPException(500, f"Erro: {str(e)}")
