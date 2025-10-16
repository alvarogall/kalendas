kalendas/
├── services/
│   ├── calendar-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── middlewares/
│   │   │   ├── utils/
│   │   │   └── app.js
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── event-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── middlewares/
│   │   │   └── app.js
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── notification-service/
│   │   ├── src/
│   │   │   ├── workers/
│   │   │   ├── utils/
│   │   │   └── app.js
│   │   ├── Dockerfile
│   │   └── package.json
│   └── api-gateway/
│       ├── src/
│       │   ├── routes/
│       │   ├── middlewares/
│       │   ├── services/
│       │   └── app.js
│       ├── openapi.yaml
│       ├── Dockerfile
│       └── package.json
│
├── webapp/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── package.json
│   └── .env.example
│
├── deployment/
│   ├── docker-compose.yml
│   ├── config/
│   │   └── env/
│   │       ├── dev.env
│   │       ├── prod.env
│   │       └── test.env
│   └── ci-cd/
│       ├── scripts/
│       │   ├── build-service.sh
│       │   ├── deploy-service.sh
│       │   └── test-service.sh
│       └── github-actions/
│           ├── calendar-ci.yml
│           ├── event-ci.yml
│           ├── notification-ci.yml
│           ├── api-gateway-ci.yml
│           ├── webapp-ci.yml
│           ├── deploy-staging.yml
│           └── deploy-production.yml
│
├── shared/
│   ├── utils/
│   ├── middlewares/
│   ├── constants/
│   └── package.json
│
├── .github/
│   └── workflows/
│       ├── calendar-ci.yml -> ../../deployment/ci-cd/github-actions/calendar-ci.yml
│       ├── event-ci.yml -> ../../deployment/ci-cd/github-actions/event-ci.yml
│       ├── notification-ci.yml -> ../../deployment/ci-cd/github-actions/notification-ci.yml
│       ├── api-gateway-ci.yml -> ../../deployment/ci-cd/github-actions/api-gateway-ci.yml
│       ├── webapp-ci.yml -> ../../deployment/ci-cd/github-actions/webapp-ci.yml
│       ├── deploy-staging.yml -> ../../deployment/ci-cd/github-actions/deploy-staging.yml
│       └── deploy-production.yml -> ../../deployment/ci-cd/github-actions/deploy-production.yml
│
├── README.md
├── .gitignore
└── .editorconfig