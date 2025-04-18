use crate::draw_resources::ShaderSettings;
use glam::UVec2;
use shader::{DrawRect, DrawSized};
use wgpu::{Buffer, Queue};

pub struct ShaderBounding {
    draw_size: egui::Vec2,
}

impl ShaderSettings for ShaderBounding {
    type DrawSettings = DrawSized;

    fn compute_shader() -> &'static str {
        "main_cs_bounding"
    }

    fn fragment_shader() -> &'static str {
        "main_fs_size"
    }

    fn new(interact_rect: egui::Rect) -> Self {
        Self {
            draw_size: interact_rect.size()
        }
    }

    fn write_buffer(&self, queue: &Queue, buffer: &Buffer, image_size: glam::UVec2) {
        let draw_settings = DrawSized {
            image_size,
            viewport_size: glam::uvec2(self.draw_size.x as u32, self.draw_size.y as u32),
        };
        queue.write_buffer(&buffer, 0, bytemuck::cast_slice(&[draw_settings]));
    }
}

pub struct ShaderOffset {
    draw_rect: egui::Rect,
}

impl ShaderSettings for ShaderOffset {
    type DrawSettings = DrawRect;

    fn compute_shader() -> &'static str {
        "main_cs_bounding"
    }

    fn fragment_shader() -> &'static str {
        "main_fs_rect"
    }

    fn new(interact_rect: egui::Rect) -> Self {
        Self { draw_rect: interact_rect }
    }

    fn write_buffer(&self, queue: &Queue, buffer: &Buffer, image_size: UVec2) {
        let viewport_size = glam::uvec2(self.draw_rect.size().x as u32, self.draw_rect.size().y as u32);
        let viewport_offset = glam::uvec2(self.draw_rect.min.x as u32, self.draw_rect.min.y as u32);
        let draw_settings = DrawRect {
            image_size,
            viewport_size,
            viewport_offset
        };
        queue.write_buffer(&buffer, 0, bytemuck::cast_slice(&[draw_settings]));
    }
}

pub struct ShaderOffsetBlocks {
    draw_rect: egui::Rect,
}

impl ShaderSettings for ShaderOffsetBlocks {
    type DrawSettings = DrawRect;

    fn compute_shader() -> &'static str {
        "main_cs_blocks"
    }

    fn fragment_shader() -> &'static str {
        "main_fs_rect"
    }

    fn new(interact_rect: egui::Rect) -> Self {
        Self { draw_rect: interact_rect }
    }

    fn write_buffer(&self, queue: &Queue, buffer: &Buffer, image_size: UVec2) {
        let viewport_size = glam::uvec2(self.draw_rect.size().x as u32, self.draw_rect.size().y as u32);
        let viewport_offset = glam::uvec2(self.draw_rect.min.x as u32, self.draw_rect.min.y as u32);
        let draw_settings = DrawRect {
            image_size,
            viewport_size,
            viewport_offset
        };
        queue.write_buffer(&buffer, 0, bytemuck::cast_slice(&[draw_settings]));
    }
}
