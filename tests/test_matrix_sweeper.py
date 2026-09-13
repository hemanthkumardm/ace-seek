"""
Test suite for Ace-Matrix Design Space Exploration (DSE) Sweeper
"""

import unittest
from workers.engines.matrix_sweeper.sweeper import MatrixSweeper
from workers.engines.matrix_sweeper.pareto import compute_pareto_frontier


class TestAceMatrix(unittest.TestCase):

    def test_pareto_frontier_dominance(self):
        """Tests that dominated points are properly filtered from Pareto frontier."""
        candidates = [
            # A: high freq, low power, small area -> Pareto optimal
            {"id": "A", "frequency_mhz": 100.0, "wns_ns": 1.0, "total_power_mw": 5.0, "area_um2": 1000.0},
            # B: lower freq, higher power, larger area -> Dominated by A!
            {"id": "B", "frequency_mhz": 80.0, "wns_ns": 0.5, "total_power_mw": 6.0, "area_um2": 1200.0},
            # C: lower freq but ultra-low power -> Non-dominated (trade-off)
            {"id": "C", "frequency_mhz": 50.0, "wns_ns": 5.0, "total_power_mw": 2.0, "area_um2": 1100.0}
        ]

        frontier = compute_pareto_frontier(candidates)
        frontier_ids = [c["id"] for c in frontier]

        self.assertIn("A", frontier_ids)
        self.assertIn("C", frontier_ids)
        self.assertNotIn("B", frontier_ids)  # B must be eliminated

    def test_matrix_sweep_execution(self):
        """Tests parallel sweep execution and metric harvesting."""
        sweeper = MatrixSweeper(
            frequencies_mhz=[50.0, 100.0],
            densities=[0.50, 0.65],
            num_workers=2
        )
        res = sweeper.run_sweep()
        self.assertEqual(res["total_variants"], 4)
        self.assertGreater(len(res["pareto_frontier"]), 0)


if __name__ == "__main__":
    unittest.main()
