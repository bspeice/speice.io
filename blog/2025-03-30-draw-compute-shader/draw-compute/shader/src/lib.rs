#![no_std]

use glam::Vec4Swizzles;
use spirv_std::spirv;

#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]
#[repr(C)]
pub struct Viewport {
    pub offset: glam::UVec2,
    pub size: glam::UVec2,
    pub image: glam::UVec2,
}

const BLOCK_SIZE: usize = 16;
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
    let width = viewport.image.x as usize;
    let height = viewport.image.y as usize;
    for x in 0..width {
        let x_even = x / BLOCK_SIZE % 2 == 0;
        for y in 0..height {
            let y_even = y / BLOCK_SIZE % 2 == 0;

            let color = if x_even == y_even { BLACK } else { WHITE };
            let index = image_index(x, y, width);
            image[index] = color;
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
    let vp_size = viewport.size.as_vec2();
    let img_size = viewport.image.as_vec2();

    let scale = (vp_size / img_size).min_element();
    let img_offset = (vp_size / scale - img_size) / 2.0;
    let img_coord = (frag_coord.xy() - viewport.offset.as_vec2()) / scale - img_offset;

    *output = if img_coord.cmpge(glam::Vec2::ZERO).all() && img_coord.cmple(img_size).all() {
        image[image_index(img_coord.x as usize, img_coord.y as usize, viewport.image.x as usize)]
    } else {
        BLACK
    }
}
