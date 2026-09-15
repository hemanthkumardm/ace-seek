"""
Unit tests for workers.engines.base and registry.
"""

import os
import tempfile
import unittest
from workers.engines.base import (
    BaseEngine,
    PPAResult,
    TimingMetrics,
    PowerMetrics,
    AreaMetrics,
    ODBContext,
)
from workers.engines.registry import (
    ENGINE_REGISTRY,
    get_engine,
    list_engines,
)


class DummyEngine(BaseEngine):
    def validate_inputs(self):
        if self.config.get("fail_validate"):
            return ["Invalid input parameter"]
        return []

    def report(self):
        return {"dummy": True}

    def _execute(self):
        if self.config.get("fail_run"):
            raise RuntimeError("Run crashed intentionally")
        return PPAResult(
            engine="DummyEngine",
            status="done",
            timing=TimingMetrics(wns=0.1, tns=0.0),
            power=PowerMetrics(total_mw=1.2),
            area=AreaMetrics(die_area_um2=10000.0),
            config_snapshot=self.config,
        )


class TestEnginesBase(unittest.TestCase):
    def test_base_engine_lifecycle(self):
        engine = DummyEngine("/tmp/test_dir", {"foo": "bar"})
        self.assertEqual(engine.status, "idle")
        self.assertEqual(engine.elapsed_seconds, 0.0)

        result = engine.run()
        self.assertEqual(engine.status, "done")
        self.assertGreaterEqual(engine.elapsed_seconds, 0.0)
        self.assertEqual(result.status, "done")
        self.assertEqual(result.timing.wns, 0.1)

        d = result.to_dict()
        reconstructed = PPAResult.from_dict(d)
        self.assertEqual(reconstructed.engine, "DummyEngine")
        self.assertEqual(reconstructed.timing.wns, 0.1)
        self.assertEqual(reconstructed.power.total_mw, 1.2)

    def test_base_engine_validation_failure(self):
        engine = DummyEngine("/tmp/test_dir", {"fail_validate": True})
        with self.assertRaises(ValueError):
            engine.run()
        self.assertEqual(engine.status, "error")

    def test_base_engine_exception_handling(self):
        engine = DummyEngine("/tmp/test_dir", {"fail_run": True})
        with self.assertRaises(RuntimeError):
            engine.run()
        self.assertEqual(engine.status, "error")

    def test_odb_context_fallback(self):
        sample_def = """VERSION 5.8 ;
DESIGN test ;
UNITS DISTANCE MICRONS 1000 ;
DIEAREA ( 0 0 ) ( 50000 50000 ) ;
COMPONENTS 2 ;
- u_cpu core_cell + PLACED ( 1000 1000 ) N ;
- u_sram ram_macro + PLACED ( 2000 2000 ) N ;
END COMPONENTS
END DESIGN
"""
        with tempfile.NamedTemporaryFile("w", suffix=".def", delete=False) as f_in:
            f_in.write(sample_def)
            in_path = f_in.name

        out_path = in_path + ".out.def"

        try:
            with ODBContext(in_path) as ctx:
                insts = ctx.get_instances()
                self.assertEqual(len(insts), 2)
                ctx.move_instance("u_sram", 12000, 15000, "S")
                ctx.lock_instance("u_sram")
                ctx.write_def(out_path)

            self.assertTrue(os.path.isfile(out_path))
            with open(out_path) as f_out:
                content = f_out.read()
                self.assertIn("u_sram ram_macro + FIXED ( 12000 15000 ) S", content)
        finally:
            if os.path.isfile(in_path):
                os.unlink(in_path)
            if os.path.isfile(out_path):
                os.unlink(out_path)

    def test_registry(self):
        engines = list_engines()
        self.assertTrue(any(e["name"] == "macro_placer" and e["available"] for e in engines))
        self.assertTrue(any(e["name"] == "ppa_optimizer" and e["available"] for e in engines))
        self.assertTrue(any(e["name"] == "timing_optimizer" and not e["available"] for e in engines))
        self.assertTrue(any(e["name"] == "congestion_resolver" and not e["available"] for e in engines))
        ppa = next(e for e in engines if e["name"] == "ppa_optimizer")
        self.assertEqual(ppa.get("status"), "model_dse")
        mp = next(e for e in engines if e["name"] == "macro_placer")
        self.assertEqual(mp.get("status"), "production")

        eng = get_engine("macro_placer", "/tmp/mp", {"self_test": True})
        self.assertIsInstance(eng, BaseEngine)

        with self.assertRaises(ValueError):
            get_engine("non_existent_engine", "/tmp", {})
        with self.assertRaises(ImportError):
            get_engine("timing_optimizer", "/tmp", {})


if __name__ == "__main__":
    unittest.main()
