#![no_std]

use glam::Vec4Swizzles;
use spirv_std::spirv;

#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]
#[repr(C)]
pub struct Viewport {
    pub image_size: glam::UVec2,
    pub viewport_offset: glam::UVec2,
    pub viewport_size: glam::UVec2,
}

const BLOCK_SIZE: u32 = 16;
const BLACK: glam::Vec4 = glam::vec4(0.0, 0.0, 0.0, 1.0);
const WHITE: glam::Vec4 = glam::vec4(1.0, 1.0, 1.0, 1.0);

fn image_index(x: usize, y: usize, width: usize) -> usize {
    y * width + x
}

#[spirv(compute(threads(1)))]
pub fn main_cs(
    #[spirv(uniform, descriptor_set = 0, binding = 0)] viewport: &Viewport,
    #[spirv(storage_buffer, descriptor_set = 0, binding = 1)] image: &mut [glam::Vec4],
) {
    let width = viewport.image_size.x as usize;
    let height = viewport.image_size.y as usize;
    for x in 0..width {
        for y in 0..height {
            let index = image_index(x, y, width);
            if x == 0
                || x == width - 1
                || y == 0
                || y == height - 1
            {
                image[index] = WHITE;
            }
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
    let pixel_coordinate = frag_coord.xy().as_usizevec2();
    let (pixel_x, pixel_y) = (pixel_coordinate.x, pixel_coordinate.y);
    let index = image_index(pixel_x, pixel_y, viewport.viewport_size.x as usize);

    *output = if index < image.len() {
        image[index]
    } else {
        BLACK
    };
}
