## Important Setup
`.env` to be created yourself and filled in based on the `.env.example` template file.
Additionally, the following are commands to be input in VSC terminal to install packages needed for project:
```
npm init -y
npm install express mssql joi dotenv
```
## Note
Pull before you start working on your code to keep up to date with most recent version of the project

## Database setup
1. Open `database/HawkerCentreDB.sql` in SQL Server Management Studio and run it.
2. Open `database/sample-data.sql` and run it after the schema script.
3. Copy `.env.example` to `.env` and enter local database settings.
4. Run `npm install`.
5. Run the application with `npm start`.