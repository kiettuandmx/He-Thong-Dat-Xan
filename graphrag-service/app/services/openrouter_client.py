import httpx


class OpenRouterClient:
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    def generate_recommendation(self, payload: dict) -> dict:
        if not self.api_key:
            return self._fallback_response(payload)

        prompt = self._build_prompt(payload)
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "Ban la tro ly dat san chi duoc dua tren du lieu da truy xuat.",
                },
                {"role": "user", "content": prompt},
            ],
        }

        try:
            response = httpx.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=body,
                headers=headers,
                timeout=20.0,
            )
            response.raise_for_status()
            data = response.json()
            answer = data["choices"][0]["message"]["content"]
            return {
                "answer": answer,
                "recommendations": payload["candidate_fields"],
            }
        except Exception:
            return self._fallback_response(payload)

    @staticmethod
    def _build_prompt(payload: dict) -> str:
        return (
            "Hay de xuat 2-3 san dua tren candidate_fields va giai thich ngan gon vi sao phu hop.\n"
            f"Constraints: {payload['constraints']}\n"
            f"Candidate fields: {payload['candidate_fields']}"
        )

    @staticmethod
    def _fallback_response(payload: dict) -> dict:
        candidates = payload["candidate_fields"]
        if not candidates:
            return {
                "answer": "Toi chua tim thay san phu hop tu du lieu hien co. Ban co the thu noi rong khu vuc hoac muc gia.",
                "recommendations": [],
            }

        lines = []
        for field in candidates:
            joined_reasons = ", ".join(field.get("reasons", []))
            lines.append(f"{field['name']}: {joined_reasons}")

        return {
            "answer": "Toi goi y mot so lua chon phu hop:\n" + "\n".join(lines),
            "recommendations": candidates,
        }

