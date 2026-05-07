# Prolance · Sprint 3 (DevOps) — branch `sadok-devops`

Monorepo bundle delivered for the Sprint 3 evaluation
(*Infrastructure CI/CD & K8s — 10 pts*) covering :

* **Backend** (Spring Boot microservices, Java 17)
* **Frontend** (Angular 19 — `daxa`)
* **DevOps stack** (Jenkins · SonarQube · Prometheus · Grafana · Alertmanager)

---

## Layout

```
.
├─ backend/                     ← all Spring Boot services
│  ├─ message-service/          · Dockerfile · Jenkinsfile · k8s/ · sonar
│  ├─ dispute-service/          · idem
│  ├─ media-analysis-service/   · idem
│  └─ … (api-gateway, eureka_server, microservice_user, …)
│
├─ frontend/                    ← Angular daxa app
│  ├─ Dockerfile · nginx.conf · Jenkinsfile · sonar-project.properties
│  ├─ karma.conf.js
│  └─ k8s/                      · Deployment + Service + Ingress
│
└─ devops/                      ← shared infrastructure (THIS DELIVERABLE)
   ├─ docker-compose.yml        · Jenkins · Sonar · Prom · Grafana · Alertmanager · cAdvisor
   ├─ monitoring/
   │  ├─ prometheus/{prometheus.yml,rules/}
   │  ├─ alertmanager/alertmanager.yml
   │  └─ grafana/{provisioning,dashboards}
   ├─ k8s/                      · namespace · MySQL · Eureka · monitoring
   ├─ kubeadm/bootstrap.sh
   └─ README.md                 · full operational guide
```

## Mapping to the rubric

| Critère | Pts | Where |
|---|---|---|
| Jenkins & Webhooks (Front & Back) | 3   | `backend/*/Jenkinsfile`, `frontend/Jenkinsfile` (`triggers { githubPush() }`) |
| Docker (back + front)             | 1.5 | `backend/*/Dockerfile`, `frontend/Dockerfile` |
| Orchestration KubeAdm             | 2.5 | `devops/kubeadm/bootstrap.sh`, every `*/k8s/*.yaml` |
| Qualité & SonarQube               | 1.5 | JaCoCo + `sonar:sonar` stage in every Jenkinsfile |
| Supervision Prom + Grafana        | 1.5 | `devops/monitoring/*` + Spring Actuator/Prometheus |
| **Excellence** (alerting + qualité + optimisation) | 2 | `devops/monitoring/prometheus/rules/*.yml`, Quality Gate stage, multi-stage Docker, gzip, healthchecks, K8s probes |

See **`devops/README.md`** for the full operational walkthrough (compose
boot, Jenkins setup, Sonar wiring, kubeadm bootstrap, Grafana dashboards,
Alertmanager + Slack).

## Pipelines on this branch

Each pipeline is a separate Multibranch job in Jenkins, all pointing at this
repo / branch but with a different *Script Path* :

| Job name                          | Script Path                                       |
|-----------------------------------|---------------------------------------------------|
| `prolance-message-service`        | `backend/message-service/Jenkinsfile`             |
| `prolance-dispute-service`        | `backend/dispute-service/Jenkinsfile`             |
| `prolance-media-analysis-service` | `backend/media-analysis-service/Jenkinsfile`      |
| `prolance-frontend-daxa`          | `frontend/Jenkinsfile`                            |
