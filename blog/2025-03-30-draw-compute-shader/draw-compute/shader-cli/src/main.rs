use std::env::args;
use spirv_builder::SpirvBuilder;

fn main() {
    let crate_path = args().nth(1).expect("Missing crate path");
    let output_path = args().nth(2).expect("Missing output path");

    let builder = SpirvBuilder::new(crate_path, "spirv-unknown-vulkan1.1");
    let build_result = builder.build().expect("Could not compile shader");
    let compile_path = build_result.module.unwrap_single();
    std::fs::copy(compile_path, output_path).expect("Unable to copy shader to destination");
}
