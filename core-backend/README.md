```
core-game-backend/
├── index.js
├── package.json
├── README.md
├── controllers/
│   └── (controller files)
├── db/
│   └── (database-related files)
├── middleware/
│   └── (express middleware)
├── model/
│   └── (data models)
├── routes/
│   └── (route definitions)
└── utils/
    └── (helpers / utilities)
```

***Set up for database connection:***
1. Go to project service account, choose `Generate new private key` to download credentials JSON file.
2. Create a folder named `credentials` in `./core-backend`, move the downloaded JSON file to this new folder and change name to `service-account-file.json`.