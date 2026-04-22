pipeline {
    agent any

    environment {
        DOCKERHUB_USER   = 'faresjebali'
        DOCKERHUB_CREDS  = 'dockerhub-credentials'
        SONARQUBE_SERVER = 'SonarQube'
        K8S_NAMESPACE    = 'pidev'
        IMAGE_TAG        = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Maven Build') {
            steps {
                script {
                    def services = [
                        'gateway', 'eureka_server', 'microservice_user', 'microservice_contract',
                        'Microservice_project', 'Microservice_proposal', 'microservice_service',
                        'dispute-service', 'media-analysis-service', 'message-service',
                        'milestone/milestone', 'payment/payment'
                    ]
                    services.each { svc ->
                        dir(svc) { sh 'mvn clean package -DskipTests -Dmaven.test.skip=true' }
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    // Map: source folder ? sonar project key
                    def serviceKeys = [
                        'gateway'               : 'gateway',
                        'eureka_server'         : 'eureka',
                        'microservice_user'     : 'user-service',
                        'microservice_contract' : 'contract-service',
                        'Microservice_project'  : 'project-service',
                        'Microservice_proposal' : 'proposal-service',
                        'microservice_service'  : 'service-ms',
                        'dispute-service'       : 'dispute-service',
                        'media-analysis-service': 'media-service',
                        'message-service'       : 'message-service',
                        'milestone/milestone'             : 'milestone',
                        'payment/payment'               : 'payment'
                    ]
                    serviceKeys.each { folder, key ->
                        // Run analysis and wait for its own quality gate — one per service
                        withSonarQubeEnv('SonarQube') {
                            dir(folder) {
                                sh """
                                    mvn sonar:sonar \\
                                      -Dsonar.projectKey=pidev-${key} \\
                                      -Dsonar.projectName=pidev-${key} \\
                                      -Dsonar.host.url=${env.SONAR_HOST_URL} \\
                                      -Dsonar.login=${env.SONAR_AUTH_TOKEN}
                                """
                            }
                        }
                        // Gate checked immediately after each service — catches every failure
                        timeout(time: 5, unit: 'MINUTES') {
                            waitForQualityGate abortPipeline: true
                        }
                    }
                }
            }
        }

        stage('Build & Push Docker Images') {
            steps {
                script {
                    // Map: source folder ? docker tag
                    def services = [
                        'gateway'               : 'gateway',
                        'eureka_server'         : 'eureka-server',
                        'microservice_user'     : 'microservice-user',
                        'microservice_contract' : 'microservice-contract',
                        'Microservice_project'  : 'microservice-project',
                        'Microservice_proposal' : 'microservice-proposal',
                        'microservice_service'  : 'microservice-service',
                        'dispute-service'       : 'dispute-service',
                        'media-analysis-service': 'media-analysis-service',
                        'message-service'       : 'message-service',
                        'milestone/milestone'             : 'milestone',
                        'payment/payment'               : 'payment'
                    ]
                    docker.withRegistry('https://index.docker.io/v1/', DOCKERHUB_CREDS) {
                        services.each { folder, tag ->
                            def image = docker.build(
                                "${DOCKERHUB_USER}/pidev_microservices:${tag}",
                                "./${folder}"
                            )
                            image.push()
                        }
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withKubeConfig([credentialsId: 'kubeconfig-credentials']) {
                    // Apply all k8s manifests (namespace already set inside each file)
                    sh 'kubectl apply -f k8s/'
                    script {
                        // Map: k8s deployment name ? docker image tag
                        // Container name inside each deployment matches the deployment name exactly
                        def deployments = [
                            'gateway'         : 'gateway',
                            'eureka'          : 'eureka-server',
                            'user-service'    : 'microservice-user',
                            'contract-service': 'microservice-contract',
                            'project-service' : 'microservice-project',
                            'proposal-service': 'microservice-proposal',
                            'service-ms'      : 'microservice-service',
                            'dispute-service' : 'dispute-service',
                            'media-service'   : 'media-analysis-service',
                            'message-service' : 'message-service',
                            'milestone'       : 'milestone',
                            'payment'         : 'payment'
                        ]
                        deployments.each { deployment, tag ->
                            sh """
                                kubectl set image deployment/${deployment} \\
                                  ${deployment}=${DOCKERHUB_USER}/pidev_microservices:${tag} \\
                                  -n ${K8S_NAMESPACE}
                                kubectl rollout status deployment/${deployment} \\
                                  -n ${K8S_NAMESPACE} --timeout=120s
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        success { echo "Build #${env.BUILD_NUMBER} deployed successfully to Kubernetes." }
        failure { echo "Build #${env.BUILD_NUMBER} failed — check logs above." }
        always  { cleanWs() }
    }
}
