#![no_std]
use spirv_std::spirv;

#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]
#[repr(C)]
pub struct Viewport {
    pub offset_x: u32,
    pub offset_y: u32,
    pub width: u32,
    pub height: u32,
}

const BLOCK_SIZE: u32 = 16;
const BLACK: glam::Vec4 = glam::vec4(0.0, 0.0, 0.0, 1.0);
const WHITE: glam::Vec4 = glam::vec4(1.0, 1.0, 1.0, 1.0);

#[spirv(compute(threads(1)))]
pub fn main_cs(
    #[spirv(uniform, descriptor_set = 0, binding = 0)] viewport: &Viewport,
    #[spirv(storage_buffer, descriptor_set = 0, binding = 1)] image: &mut [glam::Vec4],
) {
    for x in 0..viewport.width as usize {
        for y in 0..viewport.height as usize {
            let image_index = y * viewport.width as usize + x;
        }
    }
}

#[spirv(vertex)]
pub fn main_vs(
    #[spirv(vertex_index)] vert_id: u32,
    #[spirv(position, invariant)] position: &mut glam::Vec4,
) {
    let output_uv = glam::vec2(((vert_id << 1) & 2) as f32, (vert_id & 2) as f32);
    *position = (output_uv * 2.0 - 1.0, 0.0, 1.0).into();
}

#[spirv(fragment)]
pub fn main_fs(
    #[spirv(frag_coord)] frag_coord: glam::Vec4,
    #[spirv(uniform, descriptor_set = 0, binding = 0)] viewport: &Viewport,
    #[spirv(storage_buffer, descriptor_set = 0, binding = 1)] image: &mut [glam::Vec4],
    output: &mut glam::Vec4,
) {
    *output = BLACK;
}
