use draw_compute::draw_shaders::ShaderOffsetBlocks;
use draw_compute::ComputeDraw;

fn main() {
    let native_options = eframe::NativeOptions {
        renderer: eframe::Renderer::Wgpu,
        ..Default::default()
    };

    eframe::run_native(
        "Compute Draw",
        native_options,
        Box::new(|_cc| Ok(Box::new(ComputeDraw::<ShaderOffsetBlocks>::new()))),
    ).unwrap()
}