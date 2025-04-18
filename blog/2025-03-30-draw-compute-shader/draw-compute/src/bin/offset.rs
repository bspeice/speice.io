use draw_compute::draw_shaders::ShaderOffset;
use draw_compute::ComputeDraw;

fn main() {
    let native_options = eframe::NativeOptions {
        renderer: eframe::Renderer::Wgpu,
        ..Default::default()
    };

    eframe::run_native(
        "Compute Draw",
        native_options,
        Box::new(|_cc| Ok(Box::new(ComputeDraw::<ShaderOffset>::new()))),
    ).unwrap()
}