#![no_std]
use glam::Vec4Swizzles;
use spirv_std::spirv;

pub trait DrawSettings: Copy + Sized + bytemuck::Pod + bytemuck::Zeroable {}

#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]
#[repr(C)]
pub struct DrawSized {
    pub image_size: glam::UVec2,
    pub viewport_size: glam::UVec2,
}
impl DrawSettings for DrawSized {}

#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]
#[repr(C)]
pub struct DrawRect {
    pub image_size: glam::UVec2,
    pub viewport_size: glam::UVec2,
    pub viewport_offset: glam::UVec2,
}
impl DrawSettings for DrawRect {}

const BLOCK_SIZE: usize = 16;
const BLACK: glam::Vec4 = glam::vec4(0.0, 0.0, 0.0, 1.0);
const WHITE: glam::Vec4 = glam::vec4(1.0, 1.0, 1.0, 1.0);

fn image_index(x: usize, y: usize, width: usize) -> usize {
    y * width + x
}

fn in_bounds(image_coordinate: glam::Vec2, image_size: glam::Vec2) -> bool {
    image_coordinate.cmpge(glam::Vec2::ZERO).all() && image_coordinate.cmplt(image_size).all()
}

#[spirv(compute(threads(1)))]
pub fn main_cs_bounding(
    #[spirv(uniform, descriptor_set = 0, binding = 0)] viewport: &DrawSized,
    #[spirv(storage_buffer, descriptor_set = 0, binding = 1)] image: &mut [glam::Vec4],
) {
    let width = viewport.image_size.x as usize;
    let height = viewport.image_size.y as usize;

    for x in 0..width {
        for y in 0..height {
            image[image_index(x, y, width)] =
                if x == 0 || x == width - 1 || y == 0 || y == height - 1 {
                    WHITE
                } else {
                    BLACK
                }
        }
    }
}

#[spirv(compute(threads(1)))]
pub fn main_cs_blocks(
    #[spirv(uniform, descriptor_set = 0, binding = 0)] viewport: &DrawSized,
    #[spirv(storage_buffer, descriptor_set = 0, binding = 1)] image: &mut [glam::Vec4],
) {
    let width = viewport.image_size.x as usize;
    let height = viewport.image_size.y as usize;
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
pub fn main_fs_size(
    #[spirv(frag_coord)] frag_coord: glam::Vec4,
    #[spirv(uniform, descriptor_set = 0, binding = 0)] draw_settings: &DrawSized,
    #[spirv(storage_buffer, descriptor_set = 0, binding = 1)] image: &mut [glam::Vec4],
    output: &mut glam::Vec4,
) {
    let vp_size = draw_settings.viewport_size.as_vec2();
    let img_size = draw_settings.image_size.as_vec2();

    let scale = (vp_size / img_size).min_element();
    let img_offset = (vp_size / scale - img_size) / 2.0;
    let img_coord = frag_coord.xy() / scale - img_offset;

    *output = if in_bounds(img_coord, img_size) {
        image[image_index(
            img_coord.x as usize,
            img_coord.y as usize,
            img_size.x as usize,
        )]
    } else {
        BLACK
    }
}

#[spirv(fragment)]
pub fn main_fs_rect(
    #[spirv(frag_coord)] frag_coord: glam::Vec4,
    #[spirv(uniform, descriptor_set = 0, binding = 0)] draw_settings: &DrawRect,
    #[spirv(storage_buffer, descriptor_set = 0, binding = 1)] image: &mut [glam::Vec4],
    output: &mut glam::Vec4,
) {
    let vp_size = draw_settings.viewport_size.as_vec2();
    let img_size = draw_settings.image_size.as_vec2();

    let scale = (vp_size / img_size).min_element();
    let img_offset = (vp_size / scale - img_size) / 2.0;
    let img_coord =
        (frag_coord.xy() - draw_settings.viewport_offset.as_vec2()) / scale - img_offset;

    *output = if in_bounds(img_coord, img_size) {
        image[image_index(
            img_coord.x as usize,
            img_coord.y as usize,
            img_size.x as usize,
        )]
    } else {
        BLACK
    }
}
