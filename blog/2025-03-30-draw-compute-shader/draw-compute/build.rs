use std::error::Error;
use std::path::PathBuf;
use std::{env, process};

pub fn main() -> Result<(), Box<dyn Error>> {
    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap()).join("shader.spv");
    let mut cargo = process::Command::new("cargo");

    let mut shader_cli = cargo
        .current_dir("./shader-cli")
        .arg("run")
        .arg("--")
        .arg("../shader")
        .arg(out_path);

    // Clean all `RUST*`/`CARGO*` environment variables so `rust-toolchain.toml` takes over
    for env_var in env::vars() {
        if env_var.0.starts_with("RUST") || env_var.0.starts_with("CARGO") {
            shader_cli = shader_cli.env_remove(env_var.0);
        }
    }

    shader_cli.status()?;

    Ok(())
}
