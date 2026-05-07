# Prolance · Sprint 3 (DevOps) — branch `sadok-devops`

Full Sprint 3 deliverable — covers the *Infrastructure CI/CD & K8s — 10 pts*
rubric and the *Excellence (alerting / qualité / optimisation)* bonus.

---

## Layout

```
.
├─ Esprit-pi-4sae2-2026-freelanceplatform-microservice_faresjebali/
│  ├─ message-service/         · Dockerfile · Jenkinsfile · k8s/ · sonar
│  ├─ dispute-service/         · idem
│  ├─ media-analysis-service/  · idem
│  └─ … (api-gateway, eureka_server, microservice_user, etc.)
│
├─ Esprit-pi-4sae2-2026-freelanceplatform-feature-integrated-frontend/
│  ├─ Dockerfile · nginx.conf · Jenkinsfile · sonar-project.properties
│  ├─ karma.conf.js
│  └─ k8s/                     · Deployment + Service + Ingress
│
└─ devops/                     ← shared infrastructure (THIS DELIVERABLE)
   ├─ docker-compose.yml       · Jenkins · Sonar · Prom · Grafana · Alertmanager · cAdvisor
   ├─ monitoring/
   │  ├─ prometheus/{prometheus.yml,rules/}
   │  ├─ alertmanager/alertmanager.yml
   │  └─ grafana/{provisioning,dashboards}
   ├─ k8s/                     · namespace · MySQL · Eureka · monitoring · Alertmanager
   ├─ kubeadm/bootstrap.sh
   └─ README.md                · full operational guide
```

## Mapping to the rubric

| Critère | Pts | Where |
|---|---|---|
| Jenkins & Webhooks (Front & Back) | 3   | `*/Jenkinsfile` (`triggers { githubPush() }`) |
| Docker (back + front)             | 1.5 | `*/Dockerfile` (multi-stage builds) |
| Orchestration KubeAdm             | 2.5 | `devops/kubeadm/bootstrap.sh`, every `*/k8s/*.yaml` |
| Qualité & SonarQube               | 1.5 | JaCoCo + `sonar:sonar` stage in every Jenkinsfile |
| Supervision Prom + Grafana        | 1.5 | `devops/monitoring/*` + Spring Actuator/Prometheus |
| **Excellence**                    | 2   | Alertmanager rules · Quality Gate · multi-stage Docker · gzip · healthchecks · K8s probes |

See **`devops/README.md`** for the full operational walkthrough.

## Pipelines on this branch

Each pipeline is a separate Multibranch job in Jenkins, all pointing at this
repo / branch but with a different *Script Path*:

| Jenkins job name                  | Script Path                                                                                       |
|-----------------------------------|---------------------------------------------------------------------------------------------------|
| `prolance-message-service`        | `Esprit-pi-4sae2-2026-freelanceplatform-microservice_faresjebali/message-service/Jenkinsfile`     |
| `prolance-dispute-service`        | `Esprit-pi-4sae2-2026-freelanceplatform-microservice_faresjebali/dispute-service/Jenkinsfile`     |
| `prolance-media-analysis-service` | `Esprit-pi-4sae2-2026-freelanceplatform-microservice_faresjebali/media-analysis-service/Jenkinsfile` |
| `prolance-frontend-daxa`          | `Esprit-pi-4sae2-2026-freelanceplatform-feature-integrated-frontend/Jenkinsfile`                  |
