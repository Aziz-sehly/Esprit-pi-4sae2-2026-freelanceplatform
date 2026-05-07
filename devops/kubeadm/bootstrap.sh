#!/usr/bin/env bash
# =====================================================================
#  Bootstrap a single-node KubeAdm cluster (Ubuntu 22.04 LTS)
#  Run as root on the control-plane VM :  sudo bash bootstrap.sh
# =====================================================================
set -euo pipefail

K8S_VERSION="${K8S_VERSION:-1.30}"
POD_CIDR="${POD_CIDR:-10.244.0.0/16}"

echo "▶ disable swap"
swapoff -a
sed -i.bak '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

echo "▶ kernel modules + sysctl"
cat <<EOF | tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF
modprobe overlay && modprobe br_netfilter

cat <<EOF | tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sysctl --system

echo "▶ container runtime (containerd)"
apt-get update
apt-get install -y containerd
mkdir -p /etc/containerd
containerd config default | sed 's/SystemdCgroup = false/SystemdCgroup = true/' \
  | tee /etc/containerd/config.toml >/dev/null
systemctl enable --now containerd

echo "▶ install kubeadm/kubelet/kubectl ${K8S_VERSION}"
apt-get install -y apt-transport-https ca-certificates curl gpg
curl -fsSL https://pkgs.k8s.io/core:/stable:/v${K8S_VERSION}/deb/Release.key \
  | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v${K8S_VERSION}/deb/ /" \
  | tee /etc/apt/sources.list.d/kubernetes.list
apt-get update
apt-get install -y kubelet kubeadm kubectl
apt-mark hold kubelet kubeadm kubectl

echo "▶ kubeadm init"
kubeadm init --pod-network-cidr=${POD_CIDR}

echo "▶ kubeconfig for current sudo user"
USER_HOME="${SUDO_USER:-root}"
mkdir -p /home/${USER_HOME}/.kube
cp -i /etc/kubernetes/admin.conf /home/${USER_HOME}/.kube/config
chown -R ${USER_HOME}:${USER_HOME} /home/${USER_HOME}/.kube

echo "▶ Flannel CNI (matches POD_CIDR)"
sudo -u ${USER_HOME} kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml

echo "▶ allow workloads on the control plane (single-node demo)"
sudo -u ${USER_HOME} kubectl taint nodes --all node-role.kubernetes.io/control-plane- || true

echo "▶ ingress-nginx"
sudo -u ${USER_HOME} kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.2/deploy/static/provider/baremetal/deploy.yaml

echo "✓ KubeAdm cluster ready."
echo "  Then :"
echo "    kubectl apply -f devops/k8s/00-namespace.yaml"
echo "    kubectl apply -f devops/k8s/30-monitoring.yaml"
echo "    kubectl apply -f devops/k8s/10-mysql.yaml -f devops/k8s/20-eureka.yaml"
echo "    kubectl apply -f message-service/k8s/  -f dispute-service/k8s/  -f media-analysis-service/k8s/"
echo "    kubectl apply -f frontend/k8s/"
