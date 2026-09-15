"""
tests/test_flow_orchestrator.py
Unit tests verifying Ace-Seek's modular AceFlow orchestrator:
- DesignState immutability and serialization
- Hermetic step directory isolation
- Checkpoint saving & resume capabilities
- In-process execution with native AceMacroStep and AceTimingEcoStep
"""
import json
import os
import shutil
import tempfile
import unittest

from workers.engines.flow import AceFlow, DesignState, FlowStep
from workers.engines.flow.steps import (
    YosysSynthesisStep,
    OpenROADStep,
    AceMacroStep,
    AceTimingEcoStep,
)


class DummyStep(FlowStep):
    def __init__(self, step_id: str, tag: str):
        super().__init__(step_id=step_id)
        self.tag = tag

    def run(self, state: DesignState, work_dir: str, config: dict) -> DesignState:
        # Verify work_dir is isolated
        test_file = os.path.join(work_dir, "test.txt")
        with open(test_file, "w") as f:
            f.write(f"Executed {self.step_id}")

        new_metrics = dict(state.metrics)
        new_metrics[self.step_id] = self.tag

        return state.clone(
            step_id=self.step_id,
            metrics=new_metrics,
            artifacts=state.artifacts + (test_file,)
        )


class TestAceFlowOrchestrator(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp(prefix="ace_flow_test_")

    def tearDown(self):
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_design_state_immutability(self):
        s0 = DesignState(
            design_name="ibex_core",
            rtl_files=("rtl/ibex_core.v",),
            metrics={"wns": -0.45}
        )
        s1 = s0.clone(step_id="step1", metrics={"wns": -0.10})

        # s0 must remain unaffected
        self.assertEqual(s0.step_id, "init")
        self.assertEqual(s0.metrics["wns"], -0.45)
        # s1 has updated values
        self.assertEqual(s1.step_id, "step1")
        self.assertEqual(s1.metrics["wns"], -0.10)

        # Persistence test
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

        # Check step metrics aggregated
        self.assertEqual(final_state.metrics["step_a"], "alpha")
        self.assertEqual(final_state.metrics["step_b"], "beta")
        self.assertEqual(final_state.metrics["step_c"], "gamma")

        # Check isolated directories
        steps_dir = os.path.join(self.test_dir, "steps")
        self.assertTrue(os.path.exists(os.path.join(steps_dir, "00_step_a", "state.json")))
        self.assertTrue(os.path.exists(os.path.join(steps_dir, "01_step_b", "state.json")))
        self.assertTrue(os.path.exists(os.path.join(steps_dir, "02_step_c", "state.json")))

        # Check flow summary
        summary_file = os.path.join(self.test_dir, "flow_summary.json")
        self.assertTrue(os.path.exists(summary_file))
        with open(summary_file, "r") as f:
            summary = json.load(f)
            self.assertEqual(len(summary["steps_executed"]), 3)

    def test_flow_checkpoint_resume(self):
        steps = [
            DummyStep("step_a", tag="alpha"),
            DummyStep("step_b", tag="beta"),
            DummyStep("step_c", tag="gamma"),
        ]
        flow = AceFlow(name="resume_flow", steps=steps, work_dir=self.test_dir)
        init_state = DesignState(design_name="test_resume")
        flow.run(init_state)

        # Create a new flow instance resuming from step_b (index 1)
        steps_mod = [
            DummyStep("step_a", tag="alpha"),
            DummyStep("step_b", tag="beta"),
            DummyStep("step_c", tag="resumed_gamma"),
        ]
        flow_resume = AceFlow(name="resume_flow", steps=steps_mod, work_dir=self.test_dir)
        resumed_state = flow_resume.run(init_state, resume_from="step_b")

        # step_c should have new tag, but earlier metrics remain from loaded checkpoint
        self.assertEqual(resumed_state.metrics["step_a"], "alpha")
        self.assertEqual(resumed_state.metrics["step_b"], "beta")
        self.assertEqual(resumed_state.metrics["step_c"], "resumed_gamma")

    def test_in_process_engine_steps(self):
        # Test native AceMacroStep and AceTimingEcoStep in a pipeline
        steps = [
            AceMacroStep(step_id="macro_placer", halo_x=12.0, halo_y=12.0),
            AceTimingEcoStep(target_slack_ns=0.0, step_id="timing_eco"),
        ]
        flow = AceFlow(name="engine_pipeline", steps=steps, work_dir=self.test_dir)
        init_state = DesignState(
            design_name="soc_top",
            metrics={"wns": -0.32, "tns": -2.4}
        )

        final_state = flow.run(init_state)
        # Verify macro placement metrics
        self.assertIn("macro_area_um2", final_state.metrics)
        # Verify timing ECO slack repair
        self.assertGreater(final_state.metrics["wns"], -0.32)
        self.assertGreater(final_state.metrics["eco_buffers_inserted"], 0)
        self.assertEqual(final_state.status, "success")


if __name__ == "__main__":
    unittest.main()
