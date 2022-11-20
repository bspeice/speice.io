FROM mcr.microsoft.com/vscode/devcontainers/ruby:0-2.7-bullseye

RUN wget https://github.com/errata-ai/vale/releases/download/v2.21.0/vale_2.21.0_Linux_64-bit.tar.gz -O /tmp/vale.tar.gz \
 && cd /usr/local/bin \
 && tar xf /tmp/vale.tar.gz \
 && rm /tmp/vale.tar.gz