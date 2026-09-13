"""
Test suite for Ace-AutoMacro Engine
"""

import unittest
import numpy as np

from workers.engines.macro_placer.core.wirelength import weighted_average_wirelength, compute_hpwl
from workers.engines.macro_placer.core.electrostatics import ElectrostaticEngine
from workers.engines.macro_placer.legalizer.constraint_graph import legalize_macros
from workers.engines.macro_placer.legalizer.snap_grid import snap_to_manufacturing_grid


class TestAceAutoMacro(unittest.TestCase):

    def test_wirelength_gradient_finite_difference(self):
        """Tests that analytical WA gradients match numerical finite differences."""
        pos_x = np.array([10.0, 50.0, 120.0])
        pos_y = np.array([20.0, 80.0, 150.0])
        ox = np.zeros(3)
        oy = np.zeros(3)
        net_pins = [[0, 1, 2], [0, 2]]

        wl, gw_x, gw_y = weighted_average_wirelength(pos_x, pos_y, ox, oy, net_pins, gamma=4.0)

        # Check numerical gradient for x[1]
        eps = 1e-5
        pos_x_plus = pos_x.copy()
        pos_x_plus[1] += eps
        wl_plus, _, _ = weighted_average_wirelength(pos_x_plus, pos_y, ox, oy, net_pins, gamma=4.0)

        pos_x_minus = pos_x.copy()
        pos_x_minus[1] -= eps
        wl_minus, _, _ = weighted_average_wirelength(pos_x_minus, pos_y, ox, oy, net_pins, gamma=4.0)

        num_gw1 = (wl_plus - wl_minus) / (2.0 * eps)
        self.assertAlmostEqual(gw_x[1], num_gw1, places=4)

    def test_electrostatics_poisson_reconstruction(self):
        """Tests that DCT and IDCT satisfy exact spectral invertibility."""
        engine = ElectrostaticEngine(core_width=500.0, core_height=500.0, num_bins_x=32, num_bins_y=32)
        test_density = np.random.uniform(0.1, 1.0, size=(32, 32))
        
        spectral = engine.dct2(test_density)
        reconstructed = engine.idct2(spectral)
        
        max_err = np.max(np.abs(test_density - reconstructed))
        self.assertLess(max_err, 1e-12)

    def test_legalization_zero_overlap(self):
        """Tests that topological constraint graph eliminates all macro overlaps."""
        K = 4
        # Force all 4 macros to overlap at the exact same location
        pos_x = np.array([100.0, 105.0, 102.0, 108.0])
        pos_y = np.array([100.0, 101.0, 106.0, 104.0])
        widths = np.array([50.0, 50.0, 50.0, 50.0])
        heights = np.array([40.0, 40.0, 40.0, 40.0])

        leg_x, leg_y = legalize_macros(pos_x, pos_y, widths, heights, core_w=500.0, core_h=500.0, halo_x=5.0, halo_y=5.0)

        # Check all pairs
        for i in range(K):
            for j in range(i + 1, K):
                x1, y1, w1, h1 = leg_x[i], leg_y[i], widths[i], heights[i]
                x2, y2, w2, h2 = leg_x[j], leg_y[j], widths[j], heights[j]
                overlap = not (x1 + w1 <= x2 or x2 + w2 <= x1 or y1 + h1 <= y2 or y2 + h2 <= y1)
                self.assertFalse(overlap, f"Overlap detected between macro {i} and {j}")

    def test_site_row_snapping(self):
        """Tests that Y coordinates strictly align with standard cell row multiples."""
        pos_x = np.array([12.345, 98.765])
        pos_y = np.array([31.25, 67.89])
        row_height = 2.72

        sx, sy = snap_to_manufacturing_grid(pos_x, pos_y, site_height=row_height, pdn_pitch_x=0.0)
        for y in sy:
            remainder = y % row_height
            dist_to_multiple = min(remainder, row_height - remainder)
            self.assertAlmostEqual(dist_to_multiple, 0.0, places=3)

    def test_pdn_pitch_snapping(self):
        """Tests that X coordinates align to the vertical PDN power strap pitch."""
        pos_x = np.array([35.4, 78.9, 123.1])
        pos_y = np.array([30.0, 50.0, 80.0])
        pitch = 16.0
        offset = 6.0

        sx, sy = snap_to_manufacturing_grid(pos_x, pos_y, pdn_pitch_x=pitch, pdn_offset_x=offset)
        for x in sx:
            remainder = (x - offset) % pitch
            dist_to_pitch = min(remainder, pitch - remainder)
            self.assertAlmostEqual(dist_to_pitch, 0.0, places=3)

    def test_anti_notch_elimination(self):
        """Tests that narrow channels between macros are expanded to >= min_channel_width."""
        from workers.engines.macro_placer.legalizer.snap_grid import eliminate_narrow_notches
        pos_x = np.array([50.0, 108.0])  # Macro 0 width=50 -> right edge=100. Macro 1 x=108 -> channel=8um (NOTCH!)
        pos_y = np.array([50.0, 50.0])
        widths = np.array([50.0, 50.0])
        heights = np.array([50.0, 50.0])

        nx, ny = eliminate_narrow_notches(pos_x, pos_y, widths, heights, min_channel_width=20.0)
        channel = nx[1] - (nx[0] + widths[0])
        self.assertGreaterEqual(channel, 20.0)

    def test_flightline_analysis(self):
        """Tests that flightline analysis detects wirelengths, buses, and RUDY congestion."""
        from workers.engines.macro_placer.core.flightline import FlightlineAnalyzer
        analyzer = FlightlineAnalyzer(core_w=500.0, core_h=500.0)

        pos_x = np.array([50.0, 300.0, 310.0])
        pos_y = np.array([50.0, 400.0, 405.0])
        widths = np.array([50.0, 20.0, 20.0])
        heights = np.array([50.0, 20.0, 20.0])
        ox = np.zeros(3)
        oy = np.zeros(3)
        is_macro = np.array([True, False, False])

        # 10 parallel bus nets between instance 0 and instance 1
        net_pins = [[0, 1] for _ in range(10)] + [[1, 2]]

        res = analyzer.analyze_flightlines(pos_x, pos_y, widths, heights, ox, oy, net_pins, is_macro=is_macro)
        self.assertEqual(res["total_nets"], 11)
        self.assertEqual(res["detected_buses_count"], 1)  # 10-wire bus between inst 0 and inst 1
        self.assertEqual(res["buses"][0]["bus_width"], 10)

        # Test RUDY congestion map
        rudy = analyzer.compute_rudy_congestion(pos_x, pos_y, widths, heights, net_pins, grid_bins=32)
        self.assertEqual(rudy.shape, (32, 32))
        self.assertGreater(np.max(rudy), 0.0)

    def test_odb_bridge_fallback(self):
        """Tests that OdbBridge operates correctly in DefDatabase fallback mode."""
        from workers.engines.macro_placer.io.odb_bridge import OdbBridge
        bridge = OdbBridge()
        # Should gracefully report fallback status when odb C++ module is not installed
        self.assertIsNotNone(bridge.fallback_db)


if __name__ == "__main__":
    unittest.main()
