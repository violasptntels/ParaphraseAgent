# PARAPHRASE AGENT API

Paraphrase Agent adalah layanan AI berbasis microservice yang dirancang sebagai bagian dari ekosistem Multi-Agent System (MAS) "Joki Tugas AI". Agen ini menggunakan Gemini AI untuk melakukan penulisan ulang (*rewriting*), restrukturisasi sintaksis, dan penyesuaian tingkat formalitas teks secara otomatis melalui pipeline yang *type-safe* dan terstandardisasi dengan Orchestrator.

## Fitur Utama
* **Contextual Rewriting**: Mampu mendeteksi intensi gaya bahasa akademik, formal, maupun kasual secara langsung dari instruksi pengguna.
* **Similarity & Plagiarism Guard**: Dilengkapi dengan pengecekan kualitas internal untuk memastikan hasil penulisan ulang memiliki variasi struktur yang cukup dibanding teks asli.
* **Orchestrator Compliant**: Mendukung CORS penuh dan pemetaan HTTP Status Code yang dinamis untuk kelancaran komunikasi dalam pipeline MAS.

---

## API Endpoints Contract

### `POST /api/paraphrase`

Mengirimkan permintaan parafrase teks ke Paraphrase Agent. Endpoint ini mewajibkan kepatuhan terhadap struktur payload Orchestrator.

#### Request Headers
| Key | Value | Wajib |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | Ya |

#### Request Body
Kirimkan *payload* dalam format JSON dengan struktur sebagai berikut:

| Key | Tipe | Wajib | Deskripsi |
| :--- | :--- | :--- | :--- |
| `task_id` | `string` | Ya | ID unik untuk mengidentifikasi tugas/proses di level Orchestrator. |
| `agent_type` | `string` | Ya | Harus bernilai `"paraphrase"`. |
| `payload` | `object` | Ya | Objek kontainer data utama. |
| `payload.raw_text` | `string` | Ya | Teks instruksi lengkap yang berisi kalimat sumber beserta perintah gaya parafrasenya. |

**Contoh Request Payload:**
```json
{
  "task_id": "task-1718923999",
  "agent_type": "paraphrase",
  "payload": {
    "raw_text": "saya mau mengumpulkan tugas besok tapi belum selesai, tolong parafrase menjadi bahasa akademik."
  }
}
```

## Response Structure
***1. Response Success (200 OK)***
```json 
{
  "status": "success",
  "task_id": "task-1718923999",
  "data": {
    "result": "Terdapat kewajiban untuk menyerahkan tugas pada hari esok, meskipun proses penyelesaiannya saat ini belum mencapai tahap final.",
    "file_url": null
  },
  "message": "Paraphrase processed successfully.",
  "meta": {
    "validation": {
      "valid": true,
      "value": {
        "prompt": "saya mau mengumpulkan tugas besok tapi belum selesai, tolong parafrase menjadi bahasa akademik."
      }
    },
    "quality": {
      "passed": true,
      "issues": []
    }
  }
}
```

***2. Response Error (400 Bad Request)***
```json 
{
  "status": "error",
  "task_id": "task-1718923999",
  "data": null,
  "message": "Input validation failed. Missing required fields or prompt criteria not met.",
  "meta": {
    "validation": {
      "valid": false,
      "errors": ["Missing required field: payload.raw_text"]
    }
  }
}
```

***3. Response Error (422 Unprocessable Entity)***
```json 
{
  "status": "error",
  "task_id": "task-1718923999",
  "data": null,
  "message": "Generated output did not pass quality checks.",
  "meta": {
    "validation": {
      "valid": true
    },
    "quality": {
      "passed": false,
      "issues": ["Output similarity index is above acceptable threshold"]
    }
  }
}
```