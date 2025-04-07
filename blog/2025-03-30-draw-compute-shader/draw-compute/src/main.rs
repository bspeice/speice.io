use eframe::epaint::PaintCallbackInfo;
use eframe::wgpu::{CommandBuffer, CommandEncoder, Device, Queue, RenderPass};
use eframe::Frame;
use egui::{Context, Sense};
use egui_wgpu::{CallbackResources, CallbackTrait, ScreenDescriptor};

struct DrawResources {
    device: wgpu::Device,
    bind_group_layout: wgpu::BindGroupLayout,
    bind_group: wgpu::BindGroup,
    viewport_buffer: wgpu::Buffer,
    image_buffer: wgpu::Buffer,
    image_size: glam::UVec2,
    compute_pipeline: wgpu::ComputePipeline,
    render_pipeline: wgpu::RenderPipeline,
}

impl DrawResources {
    fn bind_group_layout(device: &wgpu::Device) -> wgpu::BindGroupLayout {
        device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("compute_draw"),
            entries: &[
                // viewport
                wgpu::BindGroupLayoutEntry {
                    binding: 0,
                    visibility: wgpu::ShaderStages::COMPUTE | wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
                // image
                wgpu::BindGroupLayoutEntry {
                    binding: 1,
                    visibility: wgpu::ShaderStages::COMPUTE | wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Storage { read_only: false },
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
            ],
        })
    }

    fn bind_group(
        device: &wgpu::Device,
        bind_group_layout: &wgpu::BindGroupLayout,
        viewport_buffer: &wgpu::Buffer,
        image_buffer: &wgpu::Buffer,
    ) -> wgpu::BindGroup {
        device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("compute_draw"),
            layout: bind_group_layout,
            entries: &[
                wgpu::BindGroupEntry {
                    binding: 0,
                    resource: viewport_buffer.as_entire_binding(),
                },
                wgpu::BindGroupEntry {
                    binding: 1,
                    resource: image_buffer.as_entire_binding(),
                },
            ],
        })
    }

    fn viewport_buffer(device: &wgpu::Device) -> wgpu::Buffer {
        device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("viewport"),
            size: size_of::<shader::Viewport>() as u64,
            usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::UNIFORM,
            mapped_at_creation: false,
        })
    }

    fn image_buffer(device: &wgpu::Device, width: u64, height: u64) -> wgpu::Buffer {
        device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("image"),
            size: width * height * 4 * size_of::<f32>() as u64,
            usage: wgpu::BufferUsages::STORAGE,
            mapped_at_creation: false,
        })
    }

    fn module(device: &wgpu::Device) -> wgpu::ShaderModule {
        let module_descriptor = wgpu::include_spirv!(concat!(env!("OUT_DIR"), "/shader.spv"));
        device.create_shader_module(module_descriptor)
    }

    fn compute_pipeline(
        device: &wgpu::Device,
        module: &wgpu::ShaderModule,
        bind_group_layout: &wgpu::BindGroupLayout,
    ) -> wgpu::ComputePipeline {
        let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("compute"),
            bind_group_layouts: &[bind_group_layout],
            push_constant_ranges: &[],
        });
        device.create_compute_pipeline(&wgpu::ComputePipelineDescriptor {
            label: Some("compute"),
            layout: Some(&pipeline_layout),
            module: &module,
            entry_point: Some("main_cs"),
            compilation_options: Default::default(),
            cache: None,
        })
    }

    fn render_pipeline(
        device: &wgpu::Device,
        module: &wgpu::ShaderModule,
        bind_group_layout: &wgpu::BindGroupLayout,
        format: &wgpu::TextureFormat,
    ) -> wgpu::RenderPipeline {
        let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("draw"),
            bind_group_layouts: &[bind_group_layout],
            push_constant_ranges: &[],
        });
        device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("draw"),
            layout: Some(&pipeline_layout),
            vertex: wgpu::VertexState {
                module,
                entry_point: Some("main_vs"),
                compilation_options: Default::default(),
                buffers: &[],
            },
            primitive: Default::default(),
            depth_stencil: None,
            multisample: Default::default(),
            fragment: Some(wgpu::FragmentState {
                module,
                entry_point: Some("main_fs"),
                compilation_options: Default::default(),
                targets: &[Some((*format).into())],
            }),
            multiview: None,
            cache: None,
        })
    }

    fn new(device: &wgpu::Device, format: &wgpu::TextureFormat, width: u64, height: u64) -> Self {
        let bind_group_layout = Self::bind_group_layout(device);
        let viewport_buffer = Self::viewport_buffer(device);
        let image_buffer = Self::image_buffer(device, width, height);
        let image_size = glam::uvec2(width as u32, height as u32);

        let bind_group =
            Self::bind_group(device, &bind_group_layout, &viewport_buffer, &image_buffer);

        let module = Self::module(device);
        let compute_pipeline = Self::compute_pipeline(device, &module, &bind_group_layout);
        let render_pipeline = Self::render_pipeline(device, &module, &bind_group_layout, format);

        Self {
            device: device.clone(),
            bind_group_layout,
            bind_group,
            viewport_buffer,
            image_buffer,
            image_size,
            compute_pipeline,
            render_pipeline,
        }
    }

    fn resize(&mut self, width: u64, height: u64) {
        self.image_buffer = Self::image_buffer(&self.device, width, height);
        self.image_size = glam::uvec2(width as u32, height as u32);
        self.bind_group = Self::bind_group(
            &self.device,
            &self.bind_group_layout,
            &self.viewport_buffer,
            &self.image_buffer,
        );
    }
}

struct DrawCallback {
    draw_rect: egui::Rect,
    draw_resize: bool,
}

impl CallbackTrait for DrawCallback {
    fn prepare(
        &self,
        _device: &Device,
        queue: &Queue,
        _screen_descriptor: &ScreenDescriptor,
        egui_encoder: &mut CommandEncoder,
        callback_resources: &mut CallbackResources,
    ) -> Vec<CommandBuffer> {
        let resources = callback_resources
            .get_mut::<DrawResources>()
            .expect("missing draw resources");

        if self.draw_resize {
            resources.resize(
                self.draw_rect.size().x as u64,
                self.draw_rect.size().y as u64,
            );
        }

        let viewport = shader::Viewport {
            image: resources.image_size,
            offset: glam::uvec2(self.draw_rect.min.x as u32, self.draw_rect.min.y as u32),
            size: glam::uvec2(
                self.draw_rect.size().x as u32,
                self.draw_rect.size().y as u32,
            ),
        };

        queue.write_buffer(
            &resources.viewport_buffer,
            0,
            bytemuck::cast_slice(&[viewport]),
        );

        if self.draw_resize {
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
        let resources = callback_resources.get::<DrawResources>().unwrap();

        render_pass.set_pipeline(&resources.render_pipeline);
        render_pass.set_bind_group(0, &resources.bind_group, &[]);
        render_pass.draw(0..3, 0..1);
    }
}

#[derive(Copy, Clone)]
struct ComputeDraw {
    initial_draw: bool,
}

impl eframe::App for ComputeDraw {
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
            callback_resources.insert(DrawResources::new(&device, &format, 800, 600));
        }

        egui::TopBottomPanel::bottom("bottom").show(ctx, |ui| {
            let wgpu_render_state = frame.wgpu_render_state().expect("missing WGPU state");
            let image_size = wgpu_render_state
                .renderer
                .as_ref()
                .read()
                .callback_resources
                .get::<DrawResources>()
                .unwrap()
                .image_size;

            ui.label(format!("Viewport: image={image_size}"))
        });

        egui::CentralPanel::default().show(ctx, |ui| {
            egui::Frame::canvas(ui.style()).show(ui, |ui| {
                let interact_rect = ui.available_rect_before_wrap();
                let (response, painter) = ui.allocate_painter(interact_rect.size(), Sense::click());

                let callback = DrawCallback {
                    draw_rect: interact_rect,
                    draw_resize: initial_draw || response.clicked(),
                };

                painter.add(egui_wgpu::Callback::new_paint_callback(
                    interact_rect,
                    callback,
                ))
            });
        });
    }
}

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
