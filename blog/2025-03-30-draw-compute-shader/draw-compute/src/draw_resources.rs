use shader::DrawSettings;
use std::marker::PhantomData;

pub trait ShaderSettings: Send + Sync {
    type DrawSettings: DrawSettings;

    fn compute_shader() -> &'static str;
    fn fragment_shader() -> &'static str;

    fn new(interact_rect: egui::Rect) -> Self;

    fn write_buffer(&self, queue: &wgpu::Queue, buffer: &wgpu::Buffer, image_size: glam::UVec2);
}

pub struct DrawResources<S: ShaderSettings> {
    bind_group_layout: wgpu::BindGroupLayout,
    pub bind_group: wgpu::BindGroup,
    pub viewport_buffer: wgpu::Buffer,
    image_buffer: wgpu::Buffer,
    pub image_size: glam::UVec2,
    pub compute_pipeline: wgpu::ComputePipeline,
    pub render_pipeline: wgpu::RenderPipeline,
    settings: PhantomData<S>,
}

impl<S: ShaderSettings> DrawResources<S> {
    fn bind_group_layout(device: &wgpu::Device) -> wgpu::BindGroupLayout {
        device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("compute_draw"),
            entries: &[
                // draw_settings
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
            size: size_of::<S::DrawSettings>() as u64,
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
            entry_point: Some(S::compute_shader()),
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
                entry_point: Some(S::fragment_shader()),
                compilation_options: Default::default(),
                targets: &[Some((*format).into())],
            }),
            multiview: None,
            cache: None,
        })
    }

    pub fn new(
        device: &wgpu::Device,
        format: &wgpu::TextureFormat,
        width: u64,
        height: u64,
    ) -> Self {
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
            bind_group_layout,
            bind_group,
            viewport_buffer,
            image_buffer,
            image_size,
            compute_pipeline,
            render_pipeline,
            settings: PhantomData,
        }
    }

    pub fn resize(&mut self, device: &wgpu::Device, width: u64, height: u64) {
        self.image_buffer = Self::image_buffer(device, width, height);
        self.image_size = glam::uvec2(width as u32, height as u32);
        self.bind_group = Self::bind_group(
            device,
            &self.bind_group_layout,
            &self.viewport_buffer,
            &self.image_buffer,
        );
    }
}
