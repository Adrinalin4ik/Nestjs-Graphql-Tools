## Contribution
If you want to contribute please create new PR with good description.

How to run the project:
1. Create a database
```bash
createdb -h localhost -U postgres nestjs_graphql_tools_development_public;
```
2. Fill out database config in `config/default.json`
3. Run dev server
```bash
npm i
npm run start:dev