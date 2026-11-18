"""Юнит-тесты fallback в scripts/horoscope-polish.py."""
from __future__ import annotations

import importlib.util
import json
import sys
import unittest
from pathlib import Path
from unittest import mock

SPEC = importlib.util.spec_from_file_location("horoscope_polish", Path(__file__).with_name("horoscope-polish.py"))
assert SPEC and SPEC.loader
hp = importlib.util.module_from_spec(SPEC)
sys.modules["horoscope_polish"] = hp
SPEC.loader.exec_module(hp)


def _words(n: int, prefix: str = "слово") -> str:
    return " ".join(f"{prefix}{i}" for i in range(n))


def _valid_item(sign: str, idx: int) -> dict:
    return {
        "sign": sign,
        "general": f"Уникальный зачин {idx} {sign}: " + _words(145, f"общ{idx}"),
        "love": _words(50, f"люб{idx}"),
        "career": _words(50, f"раб{idx}"),
        "health": _words(50, f"здр{idx}"),
        "advice": "Действуйте спокойно и последовательно.",
        "mood": "ровное",
    }


class FallbackToAgyTest(unittest.TestCase):
    def setUp(self) -> None:
        self.drafts = [
            {"sign": s, "general": "черновик", "love": "ч", "career": "ч", "health": "ч", "advice": "ч", "mood": "ч"}
            for s in hp.SIGNS[:4]
        ]

    def test_invalid_json_from_free_llm_triggers_agy(self) -> None:
        agy_payload = json.dumps([_valid_item(d["sign"], i) for i, d in enumerate(self.drafts)], ensure_ascii=False)
        with mock.patch.object(hp, "_run_free_llm", return_value=("не json совсем", None)) as m_free, \
             mock.patch.object(hp, "_run_agy", return_value=(agy_payload, "gemini-4-argon-low", None)) as m_agy:
            good, bad, _cost, used = hp.polish_batch(self.drafts, [], "segodnya", "2026-11-19", "auto", 60)
        self.assertEqual(m_free.call_count, 1)
        self.assertEqual(m_agy.call_count, 1)
        self.assertEqual(bad, {})
        self.assertEqual(set(good), set(hp.SIGNS[:4]))
        self.assertEqual(used, "gemini-4-argon-low")

    def test_short_validation_failure_from_free_llm_triggers_agy_for_bad_only(self) -> None:
        # Первые 2 знака валидны, 2 других слишком короткие — agy должен добить только брак
        partial = [
            _valid_item(self.drafts[0]["sign"], 0),
            _valid_item(self.drafts[1]["sign"], 1),
            {**_valid_item(self.drafts[2]["sign"], 2), "general": "слишком коротко"},
            {**_valid_item(self.drafts[3]["sign"], 3), "love": "мало"},
        ]
        agy_fix = json.dumps([_valid_item(self.drafts[2]["sign"], 2), _valid_item(self.drafts[3]["sign"], 3)], ensure_ascii=False)
        with mock.patch.object(hp, "_run_free_llm", return_value=(json.dumps(partial, ensure_ascii=False), None)), \
             mock.patch.object(hp, "_run_agy", return_value=(agy_fix, "gemini-4-argon-low", None)) as m_agy:
            good, bad, _cost, _used = hp.polish_batch(self.drafts, [], "segodnya", "2026-11-19", "auto", 60)
        self.assertEqual(m_agy.call_count, 1)
        self.assertEqual(bad, {})
        self.assertEqual(set(good), set(hp.SIGNS[:4]))
        self.assertEqual(good[self.drafts[0]["sign"]]["_model"], "free_llm")
        self.assertEqual(good[self.drafts[2]["sign"]]["_model"], "gemini-4-argon-low")


if __name__ == "__main__":
    unittest.main()
