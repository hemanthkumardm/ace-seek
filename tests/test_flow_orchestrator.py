"""
tests/test_flow_orchestrator.py
Unit tests for AceFlow orchestrator — fail-closed by default; mocks only with ACE_FLOW_MOCK.
"""
import json
import os
import shutil
import tempfile
import unittest

from workers.engines.flow import AceFlow, DesignState, FlowStep
from workers.engines.flow.steps import (
    AceMacroStep,
    AceTimingEcoStep,
    EqyLecStep,
)


class DummyStep(FlowStep):
    def __init__(self, step_id: str, tag: str, status: str = "success"):
        super().__init__(step_id=step_id)
        self.tag = tag
        self.force_status = status

    def run(self, state: DesignState, work_dir: str, config: dict) -> DesignState:
        test_file = os.path.join(work_dir, "test.txt")
        with open(test_file, "w") as f:
            f.write(f"Executed {self.step_id}")

        new_metrics = dict(state.metrics)
        new_metrics[self.step_id] = self.tag

        return state.clone(
            step_id=self.step_id,
            metrics=new_metrics,
            artifacts=state.artifacts + (test_file,),
            status=self.force_status,
        )


class TestAceFlowOrchestrator(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp(prefix="ace_flow_test_")
        os.environ.pop("ACE_FLOW_MOCK", None)

    def tearDown(self):
        os.environ.pop("ACE_FLOW_MOCK", None)
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_design_state_immutability(self):
        s0 = DesignState(
            design_name="ibex_core",
            rtl_files=("rtl/ibex_core.v",),
            metrics={"wns": -0.45},
        )
        s1 = s0.clone(step_id="step1", metrics={"wns": -0.10})

        self.assertEqual(s0.step_id, "init")
        self.assertEqual(s0.metrics["wns"], -0.45)
        self.assertEqual(s1.step_id, "step1")
        self.assertEqual(s1.metrics["wns"], -0.10)

        ckpt_path = os.path.join(self.test_dir, "state_test.json")
        s1.save(ckpt_path)
        loaded = DesignState.load(ckpt_path)
        self.assertEqual(loaded.design_name, "ibex_core")
        self.assertEqual(loaded.metrics["wns"], -0.10)

    def test_flow_sequential_execution(self):
        steps = [
            DummyStep("step_a", tag="alpha"),
            DummyStep("step_b", tag="beta"),
            DummyStep("step_c", tag="gamma"),
        ]
        flow = AceFlow(name="test_flow", steps=steps, work_dir=self.test_dir)
        init_state = DesignState(design_name="test_cpu")

        final_state = flow.run(init_state)

        self.assertEqual(final_state.metrics["step_a"], "alpha")
        self.assertEqual(final_state.metrics["step_b"], "beta")
        self.assertEqual(final_state.metrics["step_c"], "gamma")

        steps_dir = os.path.join(self.test_dir, "steps")
        self.assertTrue(os.path.exists(os.path.join(steps_dir, "00_step_a", "state.json")))
        self.assertTrue(os.path.exists(os.path.join(steps_dir, "01_step_b", "state.json")))
        self.assertTrue(os.path.exists(os.path.join(steps_dir, "02_step_c", "state.json")))

        summary_file = os.path.join(self.test_dir, "flow_summary.json")
        self.assertTrue(os.path.exists(summary_file))
        with open(summary_file, "r") as f:
            summary = json.load(f)
            self.assertEqual(len(summary["steps_executed"]), 3)

    def test_flow_aborts_on_failure(self):
        steps = [
            DummyStep("step_a", tag="alpha"),
            DummyStep("step_b", tag="beta", status="failed"),
            DummyStep("step_c", tag="gamma"),
        ]
        flow = AceFlow(name="abort_flow", steps=steps, work_dir=self.test_dir)
        final_state = flow.run(DesignState(design_name="abort_cpu"))
        self.assertEqual(final_state.status, "failed")
        self.assertNotIn("step_c", final_state.metrics)
        with open(os.path.join(self.test_dir, "flow_summary.json")) as f:
            summary = json.load(f)
        self.assertTrue(summary.get("aborted_on_failure"))
        self.assertEqual(len(summary["steps_executed"]), 2)

    def test_flow_checkpoint_resume(self):
        steps = [
            DummyStep("step_a", tag="alpha"),
            DummyStep("step_b", tag="beta"),
            DummyStep("step_c", tag="gamma"),
        ]
        flow = AceFlow(name="resume_flow", steps=steps, work_dir=self.test_dir)
        init_state = DesignState(design_name="test_resume")
        flow.run(init_state)

        steps_mod = [
            DummyStep("step_a", tag="alpha"),
            DummyStep("step_b", tag="beta"),
            DummyStep("step_c", tag="resumed_gamma"),
        ]
        flow_resume = AceFlow(name="resume_flow", steps=steps_mod, work_dir=self.test_dir)
        resumed_state = flow_resume.run(init_state, resume_from="step_b")

        self.assertEqual(resumed_state.metrics["step_a"], "alpha")
        self.assertEqual(resumed_state.metrics["step_b"], "beta")
        self.assertEqual(resumed_state.metrics["step_c"], "resumed_gamma")

    def test_eco_script_only_does_not_fake_slack(self):
        steps = [AceTimingEcoStep(target_slack_ns=0.0, step_id="timing_eco")]
        flow = AceFlow(name="eco_pipeline", steps=steps, work_dir=self.test_dir)
        init_state = DesignState(
            design_name="soc_top",
            metrics={"wns": -0.32, "tns": -2.4},
        )
        final_state = flow.run(init_state)
        # Without mock mode, WNS must remain the reported input
        self.assertEqual(final_state.metrics["wns"], -0.32)
        self.assertEqual(final_state.metrics["eco_mode"], "script_only")
        self.assertGreater(final_state.metrics["eco_buffers_inserted"], 0)

    def test_eco_mock_may_simulate_slack(self):
        os.environ["ACE_FLOW_MOCK"] = "1"
        steps = [AceTimingEcoStep(target_slack_ns=0.0, step_id="timing_eco")]
        flow = AceFlow(name="eco_mock", steps=steps, work_dir=self.test_dir)
        init_state = DesignState(
            design_name="soc_top",
            metrics={"wns": -0.32, "tns": -2.4},
        )
        final_state = flow.run(init_state)
        self.assertGreater(final_state.metrics["wns"], -0.32)
        self.assertEqual(final_state.metrics["eco_mode"], "mock_simulated")

    def test_eqy_fail_closed_without_binary(self):
        steps = [EqyLecStep(mode="rtl_vs_synth", step_id="lec_synthesis", depth=12)]
        flow = AceFlow(name="formal_fail", steps=steps, work_dir=self.test_dir)
        init_state = DesignState(
            design_name="riscv_core",
            rtl_files=("rtl/riscv_core.v",),
            netlist="outputs/synthesis_riscv_core.v",
        )
        final_state = flow.run(init_state)
        self.assertFalse(final_state.metrics.get("lec_equivalent", True))
        self.assertEqual(final_state.status, "failed")
        self.assertEqual(final_state.metrics.get("lec_note"), "eqy_missing_or_failed")

        eqy_synth = os.path.join(
            self.test_dir, "steps", "00_lec_synthesis", "riscv_core_rtl_vs_synth.eqy"
        )
        self.assertTrue(os.path.exists(eqy_synth))
        with open(eqy_synth) as f:
            body = f.read()
        self.assertNotIn("mode rtl_vs_synth", body)
        self.assertIn("[gold]", body)
        self.assertIn("[gate]", body)
        self.assertIn("[strategy sat]", body)

    def test_eqy_mock_mode_success(self):
        os.environ["ACE_FLOW_MOCK"] = "1"
        steps = [
            EqyLecStep(mode="rtl_vs_synth", step_id="lec_synthesis"),
            EqyLecStep(mode="synth_vs_layout", step_id="lec_layout"),
        ]
        flow = AceFlow(name="formal_mock", steps=steps, work_dir=self.test_dir)
        init_state = DesignState(
            design_name="riscv_core",
            rtl_files=("rtl/riscv_core.v",),
            netlist="outputs/synthesis_riscv_core.v",
        )
        final_state = flow.run(init_state)
        self.assertTrue(final_state.metrics["lec_equivalent"])
        self.assertEqual(final_state.metrics["lec_note"], "mock_mode")
        self.assertEqual(final_state.status, "success")

    def test_macro_step_still_runs(self):
        steps = [AceMacroStep(step_id="macro_placer", halo_x=12.0, halo_y=12.0)]
        flow = AceFlow(name="macro_only", steps=steps, work_dir=self.test_dir)
        final_state = flow.run(DesignState(design_name="soc_top"))
        self.assertIn("macro_area_um2", final_state.metrics)


if __name__ == "__main__":
    unittest.main()
