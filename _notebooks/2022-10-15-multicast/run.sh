SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
mkdir -p "$SCRIPT_DIR"/notebook

# Package pinning because of https://github.com/jupyter-xeus/xeus-cling/issues/415
read -r -d '' RUN <<EOF
    apt update \
 && apt install -y \
        iperf3 \
        sudo \
        strace \
 && chown \$MAMBA_USER:\$MAMBA_USER /notebook \
 && sudo -u \$MAMBA_USER micromamba -y -n base install -c conda-forge \
        jupyterlab \
        xeus-cling==0.13.0 \
        libstdcxx-devel_linux-64==9.4.0 \
        libgcc-devel_linux-64==9.4.0 \
 && sudo -u \$MAMBA_USER micromamba run jupyter-lab /notebook
EOF

# --net=host: Docker networking doesn't do multicast, use host networking so the
#   local router handles it instead.
# --user=root: Install iperf3/strace
podman run --net=host --user=root --rm --volume "$SCRIPT_DIR"/notebook:/notebook:Z -it mambaorg/micromamba bash -c "$RUN"
    
