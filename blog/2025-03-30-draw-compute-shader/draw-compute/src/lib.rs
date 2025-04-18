mod draw_resources;
pub mod draw_shaders;

use std::marker::PhantomData;
use eframe::Frame;
use egui::{Context, Sense};

use crate::draw_resources::{DrawResources, ShaderSettings};
use eframe::epaint::PaintCallbackInfo;
use egui_wgpu::{CallbackResources, CallbackTrait, ScreenDescriptor};
use wgpu::{CommandBuffer, CommandEncoder, Device, Queue, RenderPass};

struct DrawCallback<S> {
    interact_rect: egui::Rect,
    interact_resize: bool,
    settings: S,
}

impl<S: ShaderSettings> DrawCallback<S> {
    fn new(interact_rect: egui::Rect, interact_resize: bool) -> Self {
        Self {
            interact_rect,
            interact_resize,
            settings: S::new(interact_rect),
        }
    }
}

impl<S: ShaderSettings + Send + Sync + 'static> CallbackTrait for DrawCallback<S> {
    fn prepare(
        &self,
        device: &Device,
        queue: &Queue,
        _screen_descriptor: &ScreenDescriptor,
        egui_encoder: &mut CommandEncoder,
        callback_resources: &mut CallbackResources,
    ) -> Vec<CommandBuffer> {
        let resources = callback_resources
            .get_mut::<DrawResources<S>>()
            .expect("missing draw resources");

        if self.interact_resize {
            resources.resize(
                device,
                self.interact_rect.width() as u64,
                self.interact_rect.height() as u64,
            );
        }

        self.settings.write_buffer(queue, &resources.viewport_buffer, resources.image_size);

        if self.interact_resize {
            let mut compute_pass = egui_encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
                label: Some("compute"),
                timestamp_writes: None,
            });

            compute_pass.set_pipeline(&resources.compute_pipeline);
            compute_pass.set_bind_group(0, &resources.bind_group, &[]);
            compute_pass.dispatch_workgroups(1, 1, 1);
        }

        vec![]
    }

    fn paint(
        &self,
        _info: PaintCallbackInfo,
        render_pass: &mut RenderPass<'static>,
        callback_resources: &CallbackResources,
    ) {
        let resources = callback_resources.get::<DrawResources<S>>().unwrap();

        render_pass.set_pipeline(&resources.render_pipeline);
        render_pass.set_bind_group(0, &resources.bind_group, &[]);
        render_pass.draw(0..3, 0..1);
    }
}

#[derive(Copy, Clone)]
pub struct ComputeDraw<S> {
    initial_draw: bool,
    settings: PhantomData<S>,
}

impl <S: ShaderSettings> ComputeDraw<S> {
    pub fn new() -> Self {
        ComputeDraw {
            initial_draw: true,
            settings: PhantomData,
        }
    }
}

impl<S: ShaderSettings + 'static> eframe::App for ComputeDraw<S> {
    fn update(&mut self, ctx: &Context, frame: &mut Frame) {
        let initial_draw = self.initial_draw;
        self.initial_draw = false;

        if initial_draw {
            let wgpu_render_state = frame.wgpu_render_state().expect("missing WGPU state");
            let device = wgpu_render_state.device.clone();
            let format = wgpu_render_state.target_format.clone();
            let callback_resources = &mut wgpu_render_state
                .renderer
                .as_ref()
                .write()
                .callback_resources;

            // Guess an initial size for initializing GPU resources, it will be adjusted later
            callback_resources.insert(DrawResources::<S>::new(&device, &format, 800, 600));
        }

        /*
        egui::TopBottomPanel::bottom("bottom").show(ctx, |ui| {
            let wgpu_render_state = frame.wgpu_render_state().expect("missing WGPU state");
            let image_size = wgpu_render_state
                .renderer
                .as_ref()
                .read()
                .callback_resources
                .get::<DrawResources<DrawSimple>>()
                .unwrap()
                .image_size;

            ui.label(format!("Viewport: image={image_size}"))
        });
         */

        egui::CentralPanel::default().show(ctx, |ui| {
            egui::Frame::canvas(ui.style()).show(ui, |ui| {
                let interact_rect = ui.available_rect_before_wrap();
                let (response, painter) = ui.allocate_painter(interact_rect.size(), Sense::click());

                painter.add(egui_wgpu::Callback::new_paint_callback(
                    interact_rect,
                    DrawCallback::<S>::new(interact_rect, initial_draw || response.clicked()),
                ))
            });
        });
    }
}

/*
fn main() {
    let native_options = eframe::NativeOptions {
        renderer: eframe::Renderer::Wgpu,
        ..Default::default()
    };

    eframe::run_native(
        "Compute Draw",
        native_options,
        Box::new(|_cc| Ok(Box::new(ComputeDraw { initial_draw: true }))),
    )
    .unwrap()
}
 */
