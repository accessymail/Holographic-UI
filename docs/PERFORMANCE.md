# Performance Verification

HUI is designed for motion-heavy desktop/application workloads. Performance must be measured on supported hardware rather than inferred from visual smoothness.

Measure at minimum:

- frame time / FPS
- main-thread utilization
- GPU utilization where available
- memory footprint and long-run growth
- card count and layout latency
- pointer/gesture input latency
- connector event-to-render latency
- screen-analysis latency
- startup and time-to-interactive

Create budgets for low-, mid- and high-tier supported hardware. Include reduced-motion and background-tab/desktop-window behavior.
