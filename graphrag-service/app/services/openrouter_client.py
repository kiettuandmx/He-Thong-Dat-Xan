import json
import re

import httpx


class OpenRouterClient:
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    def extract_constraints(self, message: str) -> dict:
        if not self.api_key:
            raise RuntimeError("missing openrouter api key")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.model,
            "response_format": {"type": "json_object"},
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Ban la bo trich xuat constraint cho tro ly dat san. "
                        "Chi duoc tra ve mot object JSON hop le voi cac key: "
                        "area, group_size, price_band, price_sort, time_preference, field_type, amenities. "
                        "Neu khong biet thi de null hoac mang rong. "
                        "Khong them giai thich."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Trich xuat constraint tu cau sau: {message}",
                },
            ],
        }

        response = httpx.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=body,
            headers=headers,
            timeout=20.0,
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return self._parse_json_object(content)

    def classify_scope(self, message: str) -> dict:
        if not self.api_key:
            raise RuntimeError("missing openrouter api key")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.model,
            "response_format": {"type": "json_object"},
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Ban la bo phan phan loai pham vi cho tro ly dat san. "
                        "Chi duoc tra ve JSON hop le voi key: status, reply. "
                        "status chi duoc la in_scope, needs_clarification, out_of_scope. "
                        "Chi coi la in_scope neu cau hoi lien quan truc tiep den du lieu trong he thong dat san, "
                        "vi du khu vuc, mon the thao, so nguoi, muc gia, san phu hop, chinh sach, lich dat, khung gio, tien ich. "
                        "Neu cau hoi la thoi tiet, tin tuc, ty so, kien thuc chung, du doan ben ngoai he thong thi la out_of_scope. "
                        "Neu out_of_scope hoac needs_clarification thi viet reply bang tieng Viet tu nhien, ngan gon va huong nguoi dung quay lai pham vi he thong. "
                        "Neu in_scope thi reply de chuoi rong."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Phan loai cau sau: {message}",
                },
            ],
        }

        response = httpx.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=body,
            headers=headers,
            timeout=20.0,
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return self._parse_json_object(content)

    def generate_recommendation(self, payload: dict) -> dict:
        if not self.api_key:
            raise RuntimeError("OPENROUTER_API_KEY is not configured")

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
            answer = self._sanitize_answer(data["choices"][0]["message"]["content"])
            return {
                "answer": answer,
                "recommendations": payload["candidate_fields"],
            }
        except Exception as error:
            raise RuntimeError("OpenRouter recommendation request failed") from error

    def stream_recommendation(self, payload: dict):
        if not self.api_key:
            raise RuntimeError("OPENROUTER_API_KEY is not configured")

        prompt = self._build_prompt(payload)
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.model,
            "stream": True,
            "messages": [
                {
                    "role": "system",
                    "content": "Ban la tro ly dat san chi duoc dua tren du lieu da truy xuat.",
                },
                {"role": "user", "content": prompt},
            ],
        }

        try:
            with httpx.stream(
                "POST",
                "https://openrouter.ai/api/v1/chat/completions",
                json=body,
                headers=headers,
                timeout=40.0,
            ) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    data = line[6:].strip()
                    if data == "[DONE]":
                        break
                    token = self._extract_stream_token(data)
                    if token:
                        yield self._sanitize_stream_chunk(token)
        except Exception as error:
            raise RuntimeError("OpenRouter recommendation stream failed") from error

    @staticmethod
    def _parse_json_object(content: str) -> dict:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass

        fenced_content = content.strip()
        if fenced_content.startswith("```"):
            lines = fenced_content.splitlines()
            if len(lines) >= 3:
                fenced_content = "\n".join(lines[1:-1])

        return json.loads(fenced_content)

    @staticmethod
    def _build_prompt(payload: dict) -> str:
        response_mode = payload.get("response_mode", "exact_match")
        constraints = payload["constraints"]
        available_suggestions = payload.get("available_suggestions", [])
        return (
            "Hay tra loi bang tieng Viet tu nhien, am ap, nhu mot nhan vien tu van san dang nhan tin voi khach.\n"
            "Chi duoc dua tren du lieu truy xuat trong context, khong duoc bo sung du lieu ngoai context.\n"
            "Khong dung markdown, khong dung **, khong viet JSON, khong dung mau cau mo dau/ket thuc co dinh lap lai moi lan.\n"
            f"Response mode: {response_mode}\n"
            "Cach tra loi mong muon:\n"
            "- Neu response_mode la exact_match, hay tom tat ngan gon xem phuong an nao hop hon va vi sao.\n"
            "- Neu response_mode la no_match, phai noi ro rang la hien chua co du lieu khop exact voi nhu cau nay.\n"
            "- Neu response_mode la no_match va co available_suggestions, chi duoc goi y nhung san trong danh sach nay nhu cac lua chon hien dang co de tham khao.\n"
            "- Khong duoc noi nhu the available_suggestions la match exact. Phai phan biet ro giua khop exact va san hien dang co.\n"
            "- Co the xuong dong de de doc, nhung dung danh so may moc neu khong can thiet.\n"
            "- Neu co trade-off, noi ngan gon theo kieu hoi thoai, vi du san nay gia mem hon, san kia tot hon neu uu tien chat luong.\n"
            f"Constraints da hieu: {constraints}\n"
            f"Candidate fields: {payload['candidate_fields']}"
            f"\nAvailable suggestions: {available_suggestions}"
        )

    @staticmethod
    def _sanitize_answer(content: str) -> str:
        text = content.replace("\r\n", "\n").strip()
        text = re.sub(r"[*_#`>-]+", "", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r"[ \t]{2,}", " ", text)
        return text.strip()

    @classmethod
    def _sanitize_stream_chunk(cls, chunk: str) -> str:
        text = chunk.replace("\r\n", "\n")
        text = re.sub(r"[*_#`>]+", "", text)
        return text

    @staticmethod
    def _extract_stream_token(raw_data: str) -> str:
        payload = json.loads(raw_data)
        choice = (payload.get("choices") or [{}])[0]
        delta = choice.get("delta") or {}
        if isinstance(delta.get("content"), str):
            return delta["content"]

        message = choice.get("message") or {}
        if isinstance(message.get("content"), str):
            return message["content"]

        return ""
