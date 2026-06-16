pipeline {

    agent any

    triggers {
        githubPush()
    }

    tools {
        nodejs 'nodejs 22.2.0'
    }

    environment {
        TARGET_BRANCH      = "${env.BRANCH_NAME}"
        ENV_COPY_FILE_PATH = '.env.server.build'
        DOCKER_HUB_ID      = 'whitewalls'

        GITHUB_TOKEN           = credentials('github-tokens')
        GITHUB_CREDENTIALS     = credentials('github-credentials')
        DOCKER_HUB_CREDENTIALS = credentials('docker-hub-credentials')
    }

    stages {

        stage('Checkout') {
            steps {
                script {
                    checkout([$class: 'GitSCM', branches: [[name: "*/${env.BRANCH_NAME}"]],
                        doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [],
                        userRemoteConfigs: [[url: 'https://github.com/cookie3029/Frontend_OVE.git',
                        credentialsId: 'github-credentials']]])
                }
            }
        }

        stage('Copy and Modify Environment File') {
            steps {
                script {
                    def envFilePath = '/var/jenkins_config/.env.server'

                    // 항상 staging 포트로 프론트/Nginx에서 찌를 수 있도록 저장 (5174 / 5178)
                    def stagingPort = (env.TARGET_BRANCH == 'main') ? '5174' : '5178'

                    def originalContent = readFile(envFilePath)

                    // 1. 서버 빌드 포트는 5173 고정이므로 안전하게 치환 유지
                    def modifiedContent = originalContent.replaceAll(/(?<=\b)PORT=.*/, "PORT=5173")

                    // 2. 컨테이너 외부 배포 환경을 위해 호스트 설정을 0.0.0.0으로 변경 (Health Check 통과용)
                    modifiedContent = modifiedContent.replaceAll(/(?<=\b)END_POINT=.*/, "END_POINT=0.0.0.0")
                    modifiedContent = modifiedContent.replaceAll(/(?<=\b)HOST=.*/, "HOST=0.0.0.0")

                    // 3. ★ 하이픈(-) 대신 언더바(_)를 사용하여 'project_dev'로 변경 ★
                    def dbName = (env.TARGET_BRANCH == 'main') ? 'project' : 'project_dev'
                    def renewModifiedContent = modifiedContent.replaceAll(/(?<=\b)DB_DATABASE=.*/, "DB_DATABASE=${dbName}")

                    writeFile(file: env.ENV_COPY_FILE_PATH, text: renewModifiedContent)
                    echo "✅ [Environment File Preparation Done] DB_DATABASE=${dbName} / HOST=0.0.0.0"
                }
            }
        }

        stage('Build & Push Docker Image') {
            when { expression { env.CHANGE_ID == null } }
            steps {
                script {
                    def imageName = (env.TARGET_BRANCH == 'main')
                        ? "${env.DOCKER_HUB_ID}/frontend:latest"
                        : "${env.DOCKER_HUB_ID}/frontend-dev:latest"
                    env.IMAGE_NAME = imageName

                    sh "docker build --build-arg ENV_FILE=${env.ENV_COPY_FILE_PATH} --no-cache -t ${imageName} ."

                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials',
                                     usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh """
                            echo "${DOCKER_PASS}" | docker login -u "${DOCKER_USER}" --password-stdin docker.io
                            docker push ${imageName}
                        """
                    }
                }
            }
        }

        stage('Deploy Staging Container') {
            when { expression { env.CHANGE_ID == null } }
            steps {
                script {
                    env.FAILED_STATE_NAME = 'Deploy Staging Container'

                    def stagingContainer = (env.TARGET_BRANCH == 'main') ? 'frontend-staging'     : 'frontend-dev-staging'
                    def stagingPort      = (env.TARGET_BRANCH == 'main') ? 5174                  : 5178
                    env.STAGING_CONTAINER = stagingContainer
                    env.STAGING_PORT      = "${stagingPort}"

                    def deployCommand = """
                        docker pull ${env.IMAGE_NAME} && \
                        docker stop ${stagingContainer} 2>/dev/null || true && \
                        docker rm   ${stagingContainer} 2>/dev/null || true && \
                        docker run -d --name ${stagingContainer} -p ${stagingPort}:5173 ${env.IMAGE_NAME}
                    """.trim()

                    withCredentials([sshUserPrivateKey(credentialsId: 'oci-ssh-key',
                                     keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                        sh """
                            ssh -i \$SSH_KEY -o StrictHostKeyChecking=no \$SSH_USER@168.107.42.66 "${deployCommand}"
                        """
                    }
                }
            }
        }

        stage('Switch Nginx to Staging') {
            when { expression { env.CHANGE_ID == null } }
            steps {
                script {
                    env.FAILED_STATE_NAME = 'Switch Nginx to Staging'

                    def stagingPort     = env.STAGING_PORT
                    def nginxConfigFile = (env.TARGET_BRANCH == 'main') ? '/etc/nginx/conf.d/service-url.inc' : '/etc/nginx/conf.d/service-dev-url.inc'

                    // 원격에서 실행할 스크립트를 파일로 작성한다.
                    // \$service_url -> Groovy가 리터럴 $service_url 로 만들고, 원격 bash에서는 작은따옴표 안이라 그대로 유지됨.
                    def remoteScript = """
sudo touch ${nginxConfigFile}
if ! sudo grep -q 'service_url' ${nginxConfigFile}; then
    echo 'set \$service_url http://127.0.0.1:${stagingPort};' | sudo tee ${nginxConfigFile} > /dev/null
fi
sudo sed -i 's|set \$service_url http://127.0.0.1:[0-9]*|set \$service_url http://127.0.0.1:${stagingPort}|g' ${nginxConfigFile}
sudo nginx -s reload
"""
                    writeFile file: 'switch_nginx.sh', text: remoteScript

                    withCredentials([sshUserPrivateKey(credentialsId: 'oci-ssh-key',
                                     keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                        sh '''
                            echo "===> Switch Nginx -> Staging..."
                            ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER"@168.107.42.66 'bash -s' < switch_nginx.sh
                        '''
                    }
                }
            }
        }

        stage('Deploy Service Container') {
            when { expression { env.CHANGE_ID == null } }
            steps {
                script {
                    env.FAILED_STATE_NAME = 'Deploy Service Container'

                    def serviceContainer = (env.TARGET_BRANCH == 'main') ? 'frontend'     : 'frontend-dev'
                    def servicePort      = (env.TARGET_BRANCH == 'main') ? 5173          : 5174
                    env.SERVICE_CONTAINER = serviceContainer
                    env.SERVICE_PORT      = "${servicePort}"

                    // staging이 서비스 중이므로 안전하게 재기동 가능
                    def deployCommand = """
                        docker stop ${serviceContainer} 2>/dev/null || true && \
                        docker rm   ${serviceContainer} 2>/dev/null || true && \
                        docker run -d --name ${serviceContainer} -p ${servicePort}:5173 ${env.IMAGE_NAME}
                    """.trim()

                    withCredentials([sshUserPrivateKey(credentialsId: 'oci-ssh-key',
                                     keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                        sh """
                            ssh -i \$SSH_KEY -o StrictHostKeyChecking=no \$SSH_USER@168.107.42.66 "${deployCommand}"
                        """
                    }
                }
            }
        }

        stage('Health Check Service & Restore Nginx') {
            when { expression { env.CHANGE_ID == null } }
            steps {
                script {
                    env.FAILED_STATE_NAME = 'Health Check Service & Restore Nginx'

                    def servicePort     = env.SERVICE_PORT
                    def nginxConfigFile = (env.TARGET_BRANCH == 'main') ? '/etc/nginx/conf.d/service-url.inc' : '/etc/nginx/conf.d/service-dev-url.inc'

                    // 프론트엔드는 /api/health 가 없으므로 루트(/) 가 정상 응답(HTTP 2xx/3xx)하는지로 확인한다.
                    def healthCheckScript = """
HEALTH_URL="http://localhost:${servicePort}/"

for i in \$(seq 1 12); do
    CODE=\$(curl -s -o /dev/null -m 5 -w '%{http_code}' "\$HEALTH_URL" || echo 000)
    if [ "\$CODE" -ge 200 ] && [ "\$CODE" -lt 400 ]; then
        echo "[health] OK (HTTP \$CODE, attempt \$i)"
        exit 0
    fi
    echo "[health] attempt \$i/12 -> HTTP \$CODE"
    sleep 5
done

echo "===== HEALTH CHECK FAILED: diagnostics ====="
docker ps -a --filter name=frontend
echo "----- last response (headers) -----"
curl -i -m 5 "\$HEALTH_URL" || true
echo "----- container logs -----"
docker logs --tail 200 ${env.SERVICE_CONTAINER} 2>&1 || true
exit 1
"""
                    def restoreScript = """
sudo touch ${nginxConfigFile}
if ! sudo grep -q 'service_url' ${nginxConfigFile}; then
    echo 'set \$service_url http://127.0.0.1:${servicePort};' | sudo tee ${nginxConfigFile} > /dev/null
fi
sudo sed -i 's|set \$service_url http://127.0.0.1:[0-9]*|set \$service_url http://127.0.0.1:${servicePort}|g' ${nginxConfigFile}
sudo nginx -s reload
"""
                    writeFile file: 'health_check.sh', text: healthCheckScript
                    writeFile file: 'restore_nginx.sh', text: restoreScript

                    withCredentials([sshUserPrivateKey(credentialsId: 'oci-ssh-key',
                                     keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                        sh '''
                            echo "===> Health Check Service..."
                            ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER"@168.107.42.66 'bash -s' < health_check.sh

                            echo "===> Restore Nginx -> Service..."
                            ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER"@168.107.42.66 'bash -s' < restore_nginx.sh
                        '''
                    }
                }
            }
        }

        stage('Clean Up Staging Container') {
            when { expression { env.CHANGE_ID == null } }
            steps {
                script {
                    env.FAILED_STATE_NAME = 'Clean Up Staging Container'

                    def stagingContainer = env.STAGING_CONTAINER

                    def cleanupCommand = """
                        docker stop ${stagingContainer} 2>/dev/null || true && \
                        docker container prune -f && \
                        docker image prune -af
                    """.trim()

                    withCredentials([sshUserPrivateKey(credentialsId: 'oci-ssh-key',
                                     keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                        sh """
                            echo "===> Removing staging container [${stagingContainer}]..."
                            ssh -i \$SSH_KEY -o StrictHostKeyChecking=no \$SSH_USER@168.107.42.66 "${cleanupCommand}"
                        """
                    }
                }
            }
        }
    }
}
