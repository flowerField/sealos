#!/bin/bash
set -x

ARCH=${ARCH:-"amd64"}
CLOUD_VERSION="latest"

# pull and save images
mkdir -p output/tars

images=(
  docker.io/labring/sealos-cloud:$CLOUD_VERSION
  docker.io/labring/kubernetes:v1.25.6
  docker.io/labring/helm:v3.12.0
  docker.io/labring/cilium:v1.12.14
  docker.io/labring/cert-manager:v1.8.0
  docker.io/labring/openebs:v3.4.0
  docker.io/labring/kubernetes-reflector:v7.0.151
  docker.io/labring/ingress-nginx:v1.5.1
  docker.io/labring/kubeblocks:v0.6.4
  docker.io/labring/metrics-server:v0.6.4
)

for image in "${images[@]}"; do
  sealos pull --platform "linux/$ARCH" "$image"
  filename=$(echo "$image" | cut -d':' -f1 | tr / -)
  if [[ ! -f "output/tars/${filename}.tar" ]]; then
    sealos save -o "output/tars/${filename}.tar" "$image"
  fi
done


# get and save cli
mkdir -p output/cli

VERSION="v4.3.5"

wget https://github.com/labring/sealos/releases/download/${VERSION}/sealos_${VERSION#v}_linux_${ARCH}.tar.gz \
   && tar zxvf sealos_${VERSION#v}_linux_${ARCH}.tar.gz sealos && chmod +x sealos && mv sealos output/cli

# get and save install scripts
echo "
#!/bin/bash
bash scripts/load-images.sh
bash scripts/install.sh --cloud-version=$CLOUD_VERSION

" > output/install.sh

mkdir -p output/scripts

echo '
#!/bin/bash

for file in tars/*.tar; do
  sealos load -i $file
done

cp cli/sealos /usr/local/bin
'  > output/scripts/load-images.sh

curl -sfL https://raw.githubusercontent.com/labring/sealos/${CLOUD_VERSION}/scripts/cloud/install.sh -o output/scripts/install.sh

# tar output to a tar.gz
mv output sealos-cloud
tar czfv sealos-cloud.tar.gz sealos-cloud

# md5sum output tar.gz
md5sum sealos-cloud.tar.gz | cut -d " " -f1 > sealos-cloud.tar.gz.md5