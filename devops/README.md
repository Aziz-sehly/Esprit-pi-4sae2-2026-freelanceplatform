# Prolance · DevOps stack (Jenkins + Docker + KubeAdm + SonarQube + Grafana)

This folder centralises everything that maps to the **"Évaluation du groupe (Infrastructure CI/CD & K8s) – 10 pts"** rubric:

| # | Critère                                  | Where it lives                                                       |
|---|------------------------------------------|----------------------------------------------------------------------|
| 1 | **Jenkins & Webhooks (Front & Back)**    | `Jenkinsfile` in every service · webhook recipe below                |
| 2 | **Docker (back + front images)**         | `Dockerfile` in every service + Angular app                          |
| 3 | **Orchestration (KubeAdm)**              | `devops/kubeadm/bootstrap.sh` + `*/k8s/*.yaml`                       |
| 4 | **Qualité & Analyse Sonar**              | `sonar-project.properties` + Sonar stage in each `Jenkinsfile`       |
| 5 | **Supervision (Prometheus + Grafana)**   | `devops/monitoring/*` + Spring Actuator/Prometheus exposed by each MS |

The three backend microservices wired in this iteration are :

* `message-service`        (port `8099`)
* `dispute-service`        (port `8087`)
* `media-analysis-service` (port `8106`)

…and the **whole** Angular frontend (`daxa`) on port `80` (nginx).

---

## 1. Quick start (laptop / single VM)

```bash
# 1. Bring up the DevOps stack
docker compose -f devops/docker-compose.yml up -d

# 2. Open
#    Jenkins   http://localhost:8080
#    Sonar     http://localhost:9000
#    Grafana   http://localhost:3000  (admin / admin)
#    Prom      http://localhost:9090
```

The first time, retrieve the Jenkins admin password with :

```bash
docker exec prolance-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

In Jenkins → *Manage Plugins*, install :

* **Docker Pipeline**, **Docker Plugin**, **Kubernetes CLI** (`kubectl`)
* **NodeJS**, **Maven Integration**, **JDK Tool**
* **SonarQube Scanner**, **GitHub Integration**

Then under *Manage Jenkins → Tools* declare exactly :

| Tool name      | Type    |
|----------------|---------|
| `Maven-3.9`    | Maven   |
| `JDK-17`       | JDK     |
| `Node-20`      | NodeJS  |
| `SonarQube`    | Sonar server (URL `http://prolance-sonarqube:9000`) |

…and create credentials :

| ID                     | Type            | Used for                                |
|------------------------|-----------------|-----------------------------------------|
| `dockerhub-creds`      | Username/Pwd    | `docker login` (Jenkinsfile)           |
| `sonarqube-token`      | Secret text     | `SONAR_TOKEN`                           |
| `kubeconfig-prolance`  | Secret file     | `~/.kube/config` of the cluster         |

---

## 2. Webhook (Git → Jenkins) — *automatisation totale*

Each `Jenkinsfile` declares :

```groovy
triggers { githubPush() }
```

so a push to **any** of the three backend repos *or* the frontend repo triggers
its pipeline automatically. To wire that up :

1. Expose Jenkins publicly (or use [smee.io](https://smee.io) for a tunnel).
2. In **GitHub → Settings → Webhooks → Add webhook** :
   * Payload URL : `http://<jenkins-host>:8080/github-webhook/`
   * Content-type : `application/json`
   * Events : *Just the push event*.
3. Add a *GitHub server* under *Manage Jenkins → System → GitHub*.
4. Create one *Multibranch Pipeline* (or classic *Pipeline*) per repo, pointing
   at its `Jenkinsfile`. The pipelines defined here :

   * `freelanceplatform-microservice_faresjebali/message-service/Jenkinsfile`
   * `freelanceplatform-microservice_faresjebali/dispute-service/Jenkinsfile`
   * `freelanceplatform-microservice_faresjebali/media-analysis-service/Jenkinsfile`
   * `freelanceplatform-feature-integrated-frontend/Jenkinsfile`

> Tip : on the Multibranch job, set *Build Configuration → by Jenkinsfile* and
> point *Script Path* to the path of the file inside the repo.

---

## 3. SonarQube wiring

In SonarQube → *Account → Security → Generate Token* and store it in Jenkins as
`sonarqube-token`. The `Jenkinsfile`s call :

```bash
mvn sonar:sonar \
  -Dsonar.projectKey=prolance-message-service \
  -Dsonar.host.url=$SONAR_HOST_URL \
  -Dsonar.login=$SONAR_TOKEN
```

…thanks to the `<sonar.coverage.jacoco.xmlReportPaths>` property added to each
`pom.xml`, **JaCoCo coverage** lands automatically on the Sonar dashboard.

The frontend uses `sonarqube-scanner` against the `lcov.info` produced by Karma.

A typical project list once the first build succeeds :

```
prolance-message-service          Bugs · Coverage · Code Smells
prolance-dispute-service          Bugs · Coverage · Code Smells
prolance-media-analysis-service   Bugs · Coverage · Code Smells
prolance-frontend-daxa            Bugs · Coverage · Code Smells
```

---

## 4. Docker images produced

| Image                                   | Source                          |
|-----------------------------------------|---------------------------------|
| `prolance/message-service:<build>`      | `message-service/Dockerfile`    |
| `prolance/dispute-service:<build>`      | `dispute-service/Dockerfile`    |
| `prolance/media-analysis-service:<build>` | `media-analysis-service/Dockerfile` |
| `prolance/frontend-daxa:<build>`        | Angular app `Dockerfile`        |

All Dockerfiles are **multi-stage** (build → runtime), expose
`HEALTHCHECK`s and run as non-root.

---

## 5. KubeAdm cluster

```bash
# On the control-plane VM (Ubuntu 22.04)
sudo bash devops/kubeadm/bootstrap.sh

# Bring up shared infra
kubectl apply -f devops/k8s/00-namespace.yaml
kubectl apply -f devops/k8s/10-mysql.yaml
kubectl apply -f devops/k8s/20-eureka.yaml
kubectl apply -f devops/k8s/30-monitoring.yaml

# Bring up application
kubectl apply -f message-service/k8s/
kubectl apply -f dispute-service/k8s/
kubectl apply -f media-analysis-service/k8s/
kubectl apply -f frontend/k8s/        # daxa
```

Add `prolance.local` to your `/etc/hosts` pointing to the cluster IP and
visit it in a browser — the Angular frontend will reverse-proxy `/api`,
`/microservice-user`, `/ws` to the API gateway.

---

## 6. Supervision (Prometheus + Grafana)

* Each Spring Boot service exposes Micrometer metrics at
  `GET /actuator/prometheus`.
* `devops/monitoring/prometheus/prometheus.yml` scrapes them.
* Grafana is provisioned with the **Prolance · Microservices Overview**
  dashboard (`devops/monitoring/grafana/dashboards/prolance-services.json`)
  showing : services UP, request rate, p95 latency, 5xx errors, JVM heap,
  threads, container CPU & memory.

In-cluster, the same metrics are scraped via the
`prometheus.io/scrape` pod annotations already set on every Deployment.

---

## 7. Alerting (Excellence ★)

Prometheus loads rule files from `devops/monitoring/prometheus/rules/` and
forwards firing alerts to **Alertmanager** which then dispatches them to
Slack (or email / webhook).

### Rules shipped

`devops/monitoring/prometheus/rules/prolance.alerts.yml`

| Group                   | Alert                  | Severity | Trigger                                    |
|-------------------------|------------------------|----------|--------------------------------------------|
| `prolance.availability` | `ServiceDown`          | critical | `up == 0` for 1 min                        |
| `prolance.availability` | `TooManyRestarts`      | warning  | >2 restarts in 10 min                      |
| `prolance.http`         | `HighHttpErrorRate`    | critical | 5xx ratio > 5 % over 5 min                 |
| `prolance.http`         | `HighHttpLatencyP95`   | warning  | p95 latency > 1 s for 10 min               |
| `prolance.jvm`          | `JvmHeapPressure`      | warning  | heap > 85 % for 10 min                     |
| `prolance.jvm`          | `JvmGcPaused`          | warning  | avg GC pause > 500 ms for 10 min           |
| `prolance.host`         | `ContainerNearMemoryLimit` | warning | container >90 % of memory limit         |
| `prolance.host`         | `HostHighCPU`          | warning  | host CPU > 85 % for 10 min                 |
| `prolance.host`         | `HostHighDisk`         | warning  | filesystem > 85 % full for 10 min          |
| `prolance.watchdog`     | `Watchdog`             | info     | always firing — proves the pipeline works  |

### Alertmanager routing

`devops/monitoring/alertmanager/alertmanager.yml`

* `severity=critical` → `#alerts-critical` (Slack)
* `severity=warning`  → `#alerts-warning`  (Slack)
* `inhibit_rules` mute latency / 5xx alerts when the same service is **DOWN**
  (no alert spam).

To enable real Slack notifications, set the env var **before** starting
the stack :

```bash
SLACK_API_URL="https://hooks.slack.com/services/T0000/B0000/xxxxxxxx" \
  docker compose -f devops/docker-compose.yml up -d
```

### UIs

* Prometheus alerts page : http://localhost:9090/alerts
* Alertmanager UI        : http://localhost:9093
* Grafana dashboard       : *Prolance · Alerts overview*
  (`devops/monitoring/grafana/dashboards/prolance-alerts.json`) — KPIs +
  table of firing alerts + notification rate
* Grafana also has the **Alertmanager** datasource wired so the built-in
  *Alerting* page lists every alert.

### Demo — fire an alert in 30 seconds

```bash
# 1. start the stack
docker compose -f devops/docker-compose.yml up -d

# 2. take down the message-service (or scale it to 0 in K8s)
docker stop $(docker ps -q --filter name=message-service) || true

# 3. wait 1 min, then watch :
#    http://localhost:9090/alerts        → ServiceDown is FIRING
#    http://localhost:9093               → Alertmanager grouped it
#    Grafana → Prolance · Alerts overview shows it in the table
```

In Kubernetes :

```bash
kubectl -n prolance scale deployment message-service --replicas=0
# wait 1m, observe the alert in Prometheus / Alertmanager / Grafana
kubectl -n prolance scale deployment message-service --replicas=2
```

---

## 7. Repository layout (high level)

```
.
├─ Esprit-pi-4sae2-2026-freelanceplatform-microservice_faresjebali/
│   ├─ message-service/         ← Dockerfile · Jenkinsfile · k8s/ · sonar
│   ├─ dispute-service/         ← idem
│   ├─ media-analysis-service/  ← idem
│   └─ …other services          (untouched by this iteration)
│
├─ Esprit-pi-4sae2-2026-freelanceplatform-feature-integrated-frontend/
│   ├─ Dockerfile · nginx.conf · Jenkinsfile · sonar-project.properties
│   ├─ karma.conf.js
│   └─ k8s/                      ← Deployment + Service + Ingress
│
└─ devops/                       ← THIS folder
    ├─ docker-compose.yml        ← Jenkins · Sonar · Prom · Grafana · cAdvisor
    ├─ monitoring/
    │   ├─ prometheus/prometheus.yml
    │   └─ grafana/
    │       ├─ provisioning/{datasources,dashboards}
    │       └─ dashboards/prolance-services.json
    ├─ k8s/                      ← namespace · MySQL · Eureka · monitoring
    └─ kubeadm/bootstrap.sh
```
